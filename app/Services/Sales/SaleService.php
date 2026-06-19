<?php

namespace App\Services\Sales;

use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\StockMovement;
use App\Models\Warehouse;
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
        private readonly \App\Services\Accounting\AutomaticPostingService $postings,
    ) {}

    public function create(array $data, array $items): Sale
    {
        if ($items === []) {
            throw new InvalidArgumentException('A sale requires at least one item.');
        }

        return DB::transaction(function () use ($data, $items): Sale {
            $customer = Customer::query()->findOrFail($data['customer_id']);
            $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);
            $branchId = $warehouse->branch_id;
            
            $discount = (float) ($data['discount_total'] ?? 0);
            $tax = (float) ($data['tax_total'] ?? 0);
            $shipping = (float) ($data['shipping_total'] ?? 0);

            $normalizedItems = collect($items)->map(function (array $item): array {
                $variant = ProductVariant::query()->findOrFail($item['product_variant_id']);
                $quantity = (float) $item['quantity'];
                $unitPrice = (float) $item['unit_price'];

                if ($quantity <= 0 || $unitPrice < 0) {
                    throw new InvalidArgumentException('Sale item quantity and price are invalid.');
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

            $normalizedItems->each(fn (array $item) => $sale->items()->create([
                'tenant_id' => $this->tenantContext->id(),
                'product_variant_id' => $item['variant']->id,
                'product_batch_id' => $item['product_batch_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'line_total' => $item['line_total'],
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
        if ($sale->status !== 'draft') {
            throw new InvalidArgumentException('Only draft sales can be posted.');
        }

        return DB::transaction(function () use ($sale): Sale {
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

            // Records a stock out (negative quantity)
            $this->stockMovements->record(
                $sale->warehouse,
                $item->variant,
                StockMovement::TYPE_SALE,
                -$item->quantity,
                batch: $batch,
                unitCost: $item->variant->purchase_price, // Use cost price from product variant for inventory valuation
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
            $sale = isset($data['sale_id']) ? Sale::query()->findOrFail($data['sale_id']) : null;

            if ($sale && $sale->customer_id !== $customer->id) {
                throw new InvalidArgumentException('The selected sale does not belong to this customer.');
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
            $sale->load(['items.variant', 'warehouse']);
            
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
                    throw new InvalidArgumentException("Return quantity exceeds returnable quantity.");
                }

                $lineTotal = round($quantity * (float) $saleItem->unit_price, 4);

                // Record stock back in (positive quantity)
                $this->stockMovements->record(
                    $sale->warehouse,
                    $saleItem->variant,
                    StockMovement::TYPE_SALE_RETURN,
                    $quantity,
                    batch: $saleItem->product_batch_id ? ProductBatch::query()->find($saleItem->product_batch_id) : null,
                    unitCost: $saleItem->variant->purchase_price,
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
