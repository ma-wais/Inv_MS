<?php

namespace App\Services\Sales;

use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Services\Accounting\AutomaticPostingService;
use App\Services\Accounting\InvoiceAllocationService;
use App\Services\DocumentNumberService;
use App\Services\Inventory\StockMovementService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SaleService
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly DocumentNumberService $documentNumbers,
        private readonly StockMovementService $stockMovements,
        private readonly AutomaticPostingService $postings,
        private readonly InvoiceAllocationService $allocations = new InvoiceAllocationService,
    ) {}

    public function checkout(array $data, array $items): Sale
    {
        return DB::transaction(function () use ($data, $items): Sale {
            $customer = Customer::query()->lockForUpdate()->findOrFail($data['customer_id']);
            $sale = $this->create($data, $items);
            $payments = $data['payments'] ?? [];
            if ($payments === [] && (float) ($data['payment_amount'] ?? 0) > 0) {
                $payments[] = [
                    'amount' => $data['payment_amount'],
                    'method' => $data['payment_method'] ?? 'cash',
                    'account_id' => $data['payment_account_id'] ?? null,
                    'reference' => $data['payment_reference'] ?? null,
                ];
            }
            $paid = array_sum(array_map(fn (array $payment) => (float) $payment['amount'], $payments));
            if ($paid > (float) $sale->grand_total + 0.00001) {
                throw new InvalidArgumentException('Payments exceed the invoice total. Enter the amount applied to this sale.');
            }
            if ($sale->status !== 'posted' && $paid > 0) {
                throw new InvalidArgumentException('Post the invoice before recording a payment.');
            }
            $due = max(0, (float) $sale->grand_total - $paid);
            if ($sale->status === 'posted' && $customer->code === 'WALKIN' && $due > 0.00001) {
                throw new InvalidArgumentException('Select a registered customer for a credit sale.');
            }
            if ($sale->status === 'posted' && (float) $customer->credit_limit > 0
                && $customer->ledgerBalance() - $paid > (float) $customer->credit_limit + 0.00001) {
                throw new InvalidArgumentException('This sale exceeds the customer’s credit limit. Increase the payment or select another customer.');
            }
            foreach ($payments as $payment) {
                if ((float) $payment['amount'] > 0) {
                    $this->recordPayment($customer, [
                        ...$payment,
                        'sale_id' => $sale->id,
                        'payment_date' => $data['sale_date'],
                        'notes' => 'POS checkout payment.',
                    ]);
                }
            }

            return $sale->refresh();
        });
    }

    public function create(array $data, array $items): Sale
    {
        if ($items === []) {
            throw new InvalidArgumentException('A sale requires at least one item.');
        }

        return DB::transaction(function () use ($data, $items): Sale {
            $customer = Customer::query()->findOrFail($data['customer_id']);
            $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);
            if (! $customer->is_active || ! $warehouse->is_active) {
                throw new InvalidArgumentException('Select an active customer and warehouse.');
            }
            $branchId = $warehouse->branch_id;

            $discount = (float) ($data['discount_total'] ?? 0);
            $tax = (float) ($data['tax_total'] ?? 0);
            $shipping = (float) ($data['shipping_total'] ?? 0);

            $normalizedItems = collect($items)->map(function (array $item): array {
                $variant = ProductVariant::query()->with('product.baseUnit')->findOrFail($item['product_variant_id']);
                $quantity = (float) $item['quantity'];
                $unitPrice = (float) $item['unit_price'];

                if ($quantity <= 0 || $unitPrice < 0) {
                    throw new InvalidArgumentException('Sale item quantity and price are invalid.');
                }
                if (! $variant->is_active || ! $variant->product->is_active) {
                    throw new InvalidArgumentException('An inactive product cannot be sold.');
                }
                if (! $variant->product->baseUnit->allows_decimal && floor($quantity) !== $quantity) {
                    throw new InvalidArgumentException('This product must be sold in whole units.');
                }
                if ($variant->minimum_sale_price !== null && $unitPrice < (float) $variant->minimum_sale_price) {
                    throw new InvalidArgumentException('The price is below this product’s minimum sale price.');
                }
                $batch = ! empty($item['product_batch_id']) ? ProductBatch::query()->findOrFail($item['product_batch_id']) : null;
                if ($batch && $batch->product_variant_id !== $variant->id) {
                    throw new InvalidArgumentException('The selected batch does not belong to this product.');
                }
                if ($variant->product->track_batches && ! $batch) {
                    throw new InvalidArgumentException('Select a batch for this product.');
                }
                if ($batch?->expires_at && $batch->expires_at->toDateString() < now()->toDateString()) {
                    throw new InvalidArgumentException('Expired batches cannot be sold.');
                }

                return [
                    'variant' => $variant,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => round($quantity * $unitPrice, 4),
                    'product_batch_id' => $item['product_batch_id'] ?? null,
                ];
            });

            $subtotal = round($normalizedItems->sum('line_total'), 4);
            $grandTotal = round($subtotal - $discount + $tax + $shipping, 4);

            if ($grandTotal < 0) {
                throw new InvalidArgumentException('Sale total cannot be negative.');
            }

            $status = $data['status'] ?? 'draft';

            $sale = Sale::create([
                'tenant_id' => $this->tenantContext->id(),
                'customer_id' => $customer->id,
                'branch_id' => $branchId,
                'warehouse_id' => $warehouse->id,
                'created_by' => auth()->id(),
                'number' => $this->documentNumbers->next(Sale::class, 'SAL'),
                'invoice_number' => $data['invoice_number'] ?? null,
                'sale_date' => $data['sale_date'],
                'status' => $status,
                'subtotal' => $subtotal,
                'discount_total' => $discount,
                'tax_total' => $tax,
                'shipping_total' => $shipping,
                'grand_total' => $grandTotal,
                'paid_total' => 0, // Recorded later via recordPayment or split payment
                'posted_at' => $status === 'posted' ? now() : null,
                'notes' => $data['notes'] ?? null,
            ]);

            $normalizedItems = $this->allocations->allocate($normalizedItems, $grandTotal);
            $normalizedItems->each(fn (array $item) => $sale->items()->create([
                'tenant_id' => $this->tenantContext->id(),
                'product_variant_id' => $item['variant']->id,
                'product_batch_id' => $item['product_batch_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'line_total' => $item['line_total'],
                'net_total' => $item['net_total'],
            ]));

            if ($status === 'posted') {
                $this->postStockMovements($sale);
                $this->postings->postSale($sale);
            }

            return $sale;
        });
    }

    public function post(Sale $sale): Sale
    {
        return DB::transaction(function () use ($sale): Sale {
            $sale = Sale::query()->lockForUpdate()->findOrFail($sale->id);
            if ($sale->status !== 'draft') {
                throw new InvalidArgumentException('Only draft sales can be posted.');
            }
            $sale->update([
                'status' => 'posted',
                'posted_at' => now(),
            ]);

            $this->postStockMovements($sale);
            $this->postings->postSale($sale);

            return $sale->refresh();
        });
    }

    private function postStockMovements(Sale $sale): void
    {
        $sale->load(['items.variant', 'warehouse']);

        foreach ($sale->items as $item) {
            $batch = $item->product_batch_id ? ProductBatch::query()->find($item->product_batch_id) : null;

            $item->update(['unit_cost' => $item->variant->purchase_price]);
            // Freeze the cost when stock leaves the warehouse.
            $this->stockMovements->record(
                $sale->warehouse,
                $item->variant,
                StockMovement::TYPE_SALE,
                -$item->quantity,
                batch: $batch,
                unitCost: $item->unit_cost,
                reference: $sale,
                referenceNumber: $sale->number,
                note: 'Sale posted.',
            );
        }
    }

    public function recordPayment(Customer $customer, array $data): CustomerPayment
    {
        $amount = (float) $data['amount'];

        if ($amount <= 0) {
            throw new InvalidArgumentException('Payment amount must be greater than zero.');
        }

        return DB::transaction(function () use ($customer, $data, $amount): CustomerPayment {
            $sale = ! empty($data['sale_id']) ? Sale::query()->lockForUpdate()->findOrFail($data['sale_id']) : null;

            if ($sale && $sale->customer_id !== $customer->id) {
                throw new InvalidArgumentException('The selected sale does not belong to this customer.');
            }
            if ($sale && ($sale->status !== 'posted' || $amount > (float) $sale->grand_total - (float) $sale->paid_total - (float) $sale->returns()->sum('total') + 0.00001)) {
                throw new InvalidArgumentException('Payment exceeds the amount due, or the invoice has not been posted.');
            }
            if (! in_array($data['method'], ['cash', 'bank', 'card', 'mobile'], true)) {
                throw new InvalidArgumentException('Choose a supported payment method.');
            }

            $payment = CustomerPayment::create([
                'tenant_id' => $this->tenantContext->id(),
                'customer_id' => $customer->id,
                'sale_id' => $sale?->id,
                'account_id' => $data['account_id'] ?? null,
                'created_by' => auth()->id(),
                'number' => $this->documentNumbers->next(CustomerPayment::class, 'CPY'),
                'payment_date' => $data['payment_date'],
                'amount' => $amount,
                'method' => $data['method'],
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            if ($sale) {
                $sale->increment('paid_total', $amount);
            }

            $this->postings->postSalePayment($payment);

            return $payment;
        });
    }

    public function createReturn(Sale $sale, array $data, array $items): SaleReturn
    {
        if ($sale->status !== 'posted') {
            throw new InvalidArgumentException('Only posted sales can be returned.');
        }

        if ($items === []) {
            throw new InvalidArgumentException('A sale return requires at least one item.');
        }

        return DB::transaction(function () use ($sale, $data, $items): SaleReturn {
            $sale = Sale::query()->lockForUpdate()->findOrFail($sale->id);
            $sale->load(['items.variant.product.baseUnit', 'warehouse']);
            if ($sale->status !== 'posted') {
                throw new InvalidArgumentException('Only posted sales can be returned.');
            }
            if (count(array_unique(array_column($items, 'sale_item_id'))) !== count($items)) {
                throw new InvalidArgumentException('Select each invoice item only once.');
            }

            $return = SaleReturn::create([
                'tenant_id' => $this->tenantContext->id(),
                'customer_id' => $sale->customer_id,
                'sale_id' => $sale->id,
                'warehouse_id' => $sale->warehouse_id,
                'created_by' => auth()->id(),
                'number' => $this->documentNumbers->next(SaleReturn::class, 'SRT'),
                'return_date' => $data['return_date'],
                'status' => 'posted',
                'notes' => $data['notes'] ?? null,
                'posted_at' => now(),
            ]);

            $total = 0.0;

            foreach ($items as $returnItem) {
                $saleItem = $sale->items->firstWhere('id', (int) $returnItem['sale_item_id']);

                if (! $saleItem) {
                    throw new InvalidArgumentException('A return item does not belong to this sale.');
                }

                $quantity = (float) $returnItem['quantity'];
                $returnable = (float) $saleItem->quantity - (float) $saleItem->returned_quantity;

                if ($quantity <= 0 || $quantity > $returnable) {
                    throw new InvalidArgumentException('Return quantity exceeds returnable quantity.');
                }

                if (! $saleItem->variant->product->baseUnit->allows_decimal && floor($quantity) !== $quantity) {
                    throw new InvalidArgumentException('This product must be returned in whole units.');
                }
                if ($saleItem->unit_cost === null) {
                    throw new InvalidArgumentException('The original stock cost is unavailable. An admin must review this historical invoice before returning it.');
                }
                $lineTotal = $this->allocations->returnCredit(
                    (float) $saleItem->net_total, (float) $saleItem->quantity,
                    (float) $saleItem->returned_quantity, $quantity,
                    (float) $saleItem->returnItems()->sum('line_total'),
                );

                // Record stock back in (positive quantity)
                $this->stockMovements->record(
                    $sale->warehouse,
                    $saleItem->variant,
                    StockMovement::TYPE_SALE_RETURN,
                    $quantity,
                    batch: $saleItem->product_batch_id ? ProductBatch::query()->find($saleItem->product_batch_id) : null,
                    unitCost: $saleItem->unit_cost,
                    reference: $return,
                    referenceNumber: $return->number,
                    note: 'Sale return posted.',
                );

                SaleReturnItem::create([
                    'tenant_id' => $this->tenantContext->id(),
                    'sale_return_id' => $return->id,
                    'sale_item_id' => $saleItem->id,
                    'product_variant_id' => $saleItem->product_variant_id,
                    'product_batch_id' => $saleItem->product_batch_id,
                    'quantity' => $quantity,
                    'unit_price' => $saleItem->unit_price,
                    'unit_cost' => $saleItem->unit_cost,
                    'line_total' => $lineTotal,
                ]);

                $saleItem->increment('returned_quantity', $quantity);
                $total += $lineTotal;
            }

            $return->update(['total' => round($total, 4)]);

            $this->postings->postSaleReturn($return);

            return $return->refresh();
        });
    }
}
