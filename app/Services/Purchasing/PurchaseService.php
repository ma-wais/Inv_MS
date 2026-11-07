<?php

namespace App\Services\Purchasing;

use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\Warehouse;
use App\Services\Accounting\AutomaticPostingService;
use App\Services\Accounting\InvoiceAllocationService;
use App\Services\DocumentNumberService;
use App\Services\Inventory\StockMovementService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PurchaseService
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly DocumentNumberService $documentNumbers,
        private readonly StockMovementService $stockMovements,
        private readonly AutomaticPostingService $postings,
        private readonly InvoiceAllocationService $allocations = new InvoiceAllocationService,
    ) {}

    public function create(array $data, array $items): Purchase
    {
        if ($items === []) {
            throw new InvalidArgumentException('A purchase requires at least one item.');
        }

        return DB::transaction(function () use ($data, $items): Purchase {
            $supplier = Supplier::query()->findOrFail($data['supplier_id']);
            $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);
            $discount = (float) ($data['discount_total'] ?? 0);
            $tax = (float) ($data['tax_total'] ?? 0);
            $shipping = (float) ($data['shipping_total'] ?? 0);

            $normalizedItems = collect($items)->map(function (array $item): array {
                $variant = ProductVariant::query()->findOrFail($item['product_variant_id']);
                $quantity = (float) $item['quantity'];
                $unitCost = (float) $item['unit_cost'];

                if ($quantity <= 0 || $unitCost < 0) {
                    throw new InvalidArgumentException('Purchase item quantity and cost are invalid.');
                }

                return [
                    'variant' => $variant,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'line_total' => round($quantity * $unitCost, 4),
                    'batch_number' => $item['batch_number'] ?? null,
                    'expires_at' => $item['expires_at'] ?? null,
                ];
            });

            $subtotal = round($normalizedItems->sum('line_total'), 4);
            $grandTotal = round($subtotal - $discount + $tax + $shipping, 4);

            if ($grandTotal < 0) {
                throw new InvalidArgumentException('Purchase total cannot be negative.');
            }

            $purchase = Purchase::create([
                'supplier_id' => $supplier->id,
                'warehouse_id' => $warehouse->id,
                'created_by' => auth()->id(),
                'number' => $this->documentNumbers->next(Purchase::class, 'PUR'),
                'supplier_invoice_number' => $data['supplier_invoice_number'] ?? null,
                'purchase_date' => $data['purchase_date'],
                'due_date' => $data['due_date'] ?? null,
                'status' => $data['status'] === Purchase::STATUS_RECEIVED ? Purchase::STATUS_ORDERED : ($data['status'] ?? Purchase::STATUS_DRAFT),
                'subtotal' => $subtotal,
                'discount_total' => $discount,
                'tax_total' => $tax,
                'shipping_total' => $shipping,
                'grand_total' => $grandTotal,
                'ordered_at' => in_array($data['status'] ?? null, [Purchase::STATUS_ORDERED, Purchase::STATUS_RECEIVED], true) ? now() : null,
                'notes' => $data['notes'] ?? null,
            ]);

            $normalizedItems = $this->allocations->allocate($normalizedItems, $grandTotal);
            $normalizedItems->each(fn (array $item) => $purchase->items()->create([
                'tenant_id' => $this->tenantContext->id(),
                'product_variant_id' => $item['variant']->id,
                'quantity' => $item['quantity'],
                'unit_cost' => $item['unit_cost'],
                'line_total' => $item['line_total'],
                'net_total' => $item['net_total'],
                'batch_number' => $item['batch_number'],
                'expires_at' => $item['expires_at'],
            ]));

            return $purchase;
        });
    }

    public function receive(Purchase $purchase): Purchase
    {
        return DB::transaction(function () use ($purchase): Purchase {
            $purchase = Purchase::query()->lockForUpdate()->findOrFail($purchase->id);
            if (in_array($purchase->status, [Purchase::STATUS_RECEIVED, Purchase::STATUS_POSTED, Purchase::STATUS_CANCELLED], true)) {
                throw new InvalidArgumentException('This purchase cannot be received in its current status.');
            }
            $purchase->load(['items.variant.product', 'warehouse']);

            foreach ($purchase->items as $item) {
                $batch = null;

                if ($item->variant->product->track_batches || $item->batch_number) {
                    if (! $item->batch_number) {
                        throw new InvalidArgumentException("Batch number is required for {$item->variant->sku}.");
                    }

                    $batch = ProductBatch::firstOrCreate(
                        [
                            'product_variant_id' => $item->product_variant_id,
                            'batch_number' => $item->batch_number,
                        ],
                        ['expires_at' => $item->expires_at],
                    );
                    $item->product_batch_id = $batch->id;
                }

                $quantityToReceive = (float) $item->quantity - (float) $item->received_quantity;

                if ($quantityToReceive > 0) {
                    $this->stockMovements->record(
                        $purchase->warehouse,
                        $item->variant,
                        StockMovement::TYPE_PURCHASE,
                        $quantityToReceive,
                        batch: $batch,
                        unitCost: round((float) $item->net_total / (float) $item->quantity, 4),
                        reference: $purchase,
                        referenceNumber: $purchase->number,
                        note: 'Purchase received.',
                    );
                    $item->received_quantity = $item->quantity;
                    $item->save();
                }
            }

            $purchase->update([
                'status' => Purchase::STATUS_POSTED,
                'received_at' => now(),
                'posted_at' => now(),
            ]);

            $this->postings->postPurchase($purchase);

            return $purchase->refresh();
        });
    }

    public function recordPayment(Supplier $supplier, array $data): SupplierPayment
    {
        $amount = (float) $data['amount'];

        if ($amount <= 0) {
            throw new InvalidArgumentException('Payment amount must be greater than zero.');
        }

        return DB::transaction(function () use ($supplier, $data, $amount): SupplierPayment {
            $purchase = ! empty($data['purchase_id']) ? Purchase::query()->lockForUpdate()->findOrFail($data['purchase_id']) : null;

            if ($purchase && $purchase->supplier_id !== $supplier->id) {
                throw new InvalidArgumentException('The selected purchase does not belong to this supplier.');
            }
            if ($purchase && ($purchase->status !== Purchase::STATUS_POSTED || $amount > (float) $purchase->grand_total - (float) $purchase->paid_total - (float) $purchase->returns()->sum('total') + 0.00001)) {
                throw new InvalidArgumentException('Payment exceeds the amount due, or the purchase has not been received.');
            }
            if (! in_array($data['method'], ['cash', 'bank', 'card', 'mobile'], true)) {
                throw new InvalidArgumentException('Choose a supported payment method.');
            }

            $payment = SupplierPayment::create([
                'supplier_id' => $supplier->id,
                'purchase_id' => $purchase?->id,
                'account_id' => $data['account_id'] ?? null,
                'created_by' => auth()->id(),
                'number' => $this->documentNumbers->next(SupplierPayment::class, 'SPY'),
                'payment_date' => $data['payment_date'],
                'amount' => $amount,
                'method' => $data['method'],
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            if ($purchase) {
                $purchase->increment('paid_total', $amount);
            }

            $this->postings->postPurchasePayment($payment);

            return $payment;
        });
    }

    public function createReturn(Purchase $purchase, array $data, array $items): PurchaseReturn
    {
        if ($purchase->status !== Purchase::STATUS_POSTED) {
            throw new InvalidArgumentException('Only posted purchases can be returned.');
        }

        if ($items === []) {
            throw new InvalidArgumentException('A purchase return requires at least one item.');
        }

        return DB::transaction(function () use ($purchase, $data, $items): PurchaseReturn {
            $purchase = Purchase::query()->lockForUpdate()->findOrFail($purchase->id);
            if ($purchase->status !== Purchase::STATUS_POSTED) {
                throw new InvalidArgumentException('Only posted purchases can be returned.');
            }
            $purchase->load(['items.variant.product.baseUnit', 'warehouse']);
            if (count(array_unique(array_column($items, 'purchase_item_id'))) !== count($items)) {
                throw new InvalidArgumentException('Select each invoice item only once.');
            }
            $return = PurchaseReturn::create([
                'supplier_id' => $purchase->supplier_id,
                'purchase_id' => $purchase->id,
                'warehouse_id' => $purchase->warehouse_id,
                'created_by' => auth()->id(),
                'number' => $this->documentNumbers->next(PurchaseReturn::class, 'PRT'),
                'return_date' => $data['return_date'],
                'status' => 'posted',
                'notes' => $data['notes'] ?? null,
                'posted_at' => now(),
            ]);

            $total = 0.0;

            foreach ($items as $returnItem) {
                $purchaseItem = $purchase->items->firstWhere('id', (int) $returnItem['purchase_item_id']);

                if (! $purchaseItem) {
                    throw new InvalidArgumentException('A return item does not belong to this purchase.');
                }

                $quantity = (float) $returnItem['quantity'];
                $returnable = (float) $purchaseItem->received_quantity - (float) $purchaseItem->returned_quantity;

                if ($quantity <= 0 || $quantity > $returnable) {
                    throw new InvalidArgumentException("Return quantity for {$purchaseItem->variant->sku} exceeds received stock.");
                }

                if (! $purchaseItem->variant->product->baseUnit->allows_decimal && floor($quantity) !== $quantity) {
                    throw new InvalidArgumentException('This product must be returned in whole units.');
                }
                $lineTotal = $this->allocations->returnCredit(
                    (float) $purchaseItem->net_total, (float) $purchaseItem->quantity,
                    (float) $purchaseItem->returned_quantity, $quantity,
                    (float) $purchaseItem->returnItems()->sum('line_total'),
                );
                $this->stockMovements->record(
                    $purchase->warehouse,
                    $purchaseItem->variant,
                    StockMovement::TYPE_PURCHASE_RETURN,
                    -$quantity,
                    batch: $purchaseItem->product_batch_id ? ProductBatch::query()->find($purchaseItem->product_batch_id) : null,
                    unitCost: round((float) $purchaseItem->net_total / (float) $purchaseItem->quantity, 4),
                    reference: $return,
                    referenceNumber: $return->number,
                    note: 'Purchase return posted.',
                );

                PurchaseReturnItem::create([
                    'purchase_return_id' => $return->id,
                    'purchase_item_id' => $purchaseItem->id,
                    'product_variant_id' => $purchaseItem->product_variant_id,
                    'product_batch_id' => $purchaseItem->product_batch_id,
                    'quantity' => $quantity,
                    'unit_cost' => $purchaseItem->unit_cost,
                    'line_total' => $lineTotal,
                ]);
                $purchaseItem->increment('returned_quantity', $quantity);
                $total += $lineTotal;
            }

            $return->update(['total' => round($total, 4)]);

            $this->postings->postPurchaseReturn($return);

            return $return->refresh();
        });
    }
}
