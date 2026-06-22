<?php

namespace App\Services\Reporting;

use App\Models\Customer;
use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\SaleItem;
use App\Models\Supplier;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class OperationalReportService
{
    public function inventoryValuation(): Collection
    {
        return ProductVariant::query()
            ->with(['product:id,name,base_unit_id', 'product.baseUnit:id,symbol', 'stockBalances'])
            ->where('is_active', true)
            ->get()
            ->map(function (ProductVariant $variant) {
                $stockQuantity = (float) $variant->stockBalances->sum('quantity');
                $purchasePrice = (float) $variant->purchase_price;
                $valuation = round($stockQuantity * $purchasePrice, 4);

                return [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'name' => $variant->name,
                    'product_name' => $variant->product->name,
                    'unit' => $variant->product->baseUnit->symbol ?? 'pc',
                    'purchase_price' => $purchasePrice,
                    'stock_quantity' => $stockQuantity,
                    'valuation' => $valuation,
                ];
            })
            ->sortBy('sku')
            ->values();
    }

    public function productProfit(): Collection
    {
        // Get all sold items from posted sales
        return SaleItem::query()
            ->select('product_variant_id', DB::raw('SUM(quantity) as quantity_sold'), DB::raw('SUM(line_total) as revenue'))
            ->whereHas('sale', function ($query) {
                $query->where('status', 'posted');
            })
            ->groupBy('product_variant_id')
            ->with(['variant.product'])
            ->get()
            ->map(function (SaleItem $item) {
                $variant = $item->variant;
                $quantitySold = (float) $item->quantity_sold;
                $revenue = (float) $item->revenue;
                
                // COGS = Quantity Sold * Variant Purchase Price (Cost)
                $purchasePrice = $variant ? (float) $variant->purchase_price : 0.0;
                $cogs = round($quantitySold * $purchasePrice, 4);
                $profit = round($revenue - $cogs, 4);

                return [
                    'variant_id' => $item->product_variant_id,
                    'sku' => $variant ? $variant->sku : 'DELETED',
                    'name' => $variant ? $variant->name : 'DELETED',
                    'product_name' => ($variant && $variant->product) ? $variant->product->name : 'DELETED',
                    'quantity_sold' => $quantitySold,
                    'revenue' => $revenue,
                    'cogs' => $cogs,
                    'profit' => $profit,
                ];
            })
            ->sortByDesc('profit')
            ->values();
    }

    public function expiryReport(): Collection
    {
        return ProductBatch::query()
            ->with(['variant.product', 'variant.stockBalances'])
            ->orderBy('expires_at')
            ->get()
            ->map(function (ProductBatch $batch) {
                // Get batch stock across warehouses
                $stockQuantity = (float) $batch->variant->stockBalances
                    ->where('product_batch_id', $batch->id)
                    ->sum('quantity');

                $daysToExpiry = $batch->expires_at ? now()->diffInDays($batch->expires_at, false) : null;

                return [
                    'id' => $batch->id,
                    'batch_number' => $batch->batch_number,
                    'sku' => $batch->variant->sku,
                    'variant_name' => $batch->variant->name,
                    'product_name' => $batch->variant->product->name,
                    'expires_at' => $batch->expires_at ? $batch->expires_at->toDateString() : 'N/A',
                    'days_to_expiry' => $daysToExpiry !== null ? (int) $daysToExpiry : '—',
                    'stock_quantity' => $stockQuantity,
                    'status' => $daysToExpiry === null ? 'good' : ($daysToExpiry < 0 ? 'expired' : ($daysToExpiry <= 90 ? 'expiring_soon' : 'good')),
                ];
            })
            ->values();
    }

    public function receivablesPayables(): array
    {
        $receivables = Customer::query()
            ->get()
            ->map(function (Customer $customer) {
                return [
                    'id' => $customer->id,
                    'code' => $customer->code,
                    'name' => $customer->name,
                    'phone' => $customer->phone ?? '—',
                    'balance' => $customer->ledger_balance,
                ];
            })
            ->filter(fn ($row) => $row['balance'] > 0.001)
            ->sortByDesc('balance')
            ->values();

        $payables = Supplier::query()
            ->get()
            ->map(function (Supplier $supplier) {
                return [
                    'id' => $supplier->id,
                    'code' => $supplier->code,
                    'name' => $supplier->name,
                    'phone' => $supplier->phone ?? '—',
                    'balance' => $supplier->ledger_balance,
                ];
            })
            ->filter(fn ($row) => $row['balance'] > 0.001)
            ->sortByDesc('balance')
            ->values();

        return [
            'receivables' => $receivables->toArray(),
            'payables' => $payables->toArray(),
            'total_receivables' => round($receivables->sum('balance'), 4),
            'total_payables' => round($payables->sum('balance'), 4),
        ];
    }
}
