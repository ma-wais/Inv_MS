<?php

namespace App\Services\Reporting;

use App\Models\Customer;
use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\SaleItem;
use App\Models\SaleReturnItem;
use App\Models\Supplier;
use Illuminate\Support\Collection;

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

    public function productProfit(?string $startDate = null, ?string $endDate = null): Collection
    {
        $sales = SaleItem::query()->select('product_variant_id')
            ->selectRaw('SUM(quantity) as quantity_sold, SUM(COALESCE(net_total, line_total)) as revenue, SUM(quantity * COALESCE(unit_cost, 0)) as cogs, SUM(CASE WHEN unit_cost IS NULL THEN 1 ELSE 0 END) as unknown_costs')
            ->whereHas('sale', fn ($query) => $query->where('status', 'posted')
                ->when($startDate, fn ($query) => $query->where('sale_date', '>=', $startDate))
                ->when($endDate, fn ($query) => $query->where('sale_date', '<=', $endDate)))
            ->groupBy('product_variant_id')->with('variant.product')->get();
        $returns = SaleReturnItem::query()->select('product_variant_id')
            ->selectRaw('SUM(quantity) as quantity_sold, SUM(line_total) as revenue, SUM(quantity * COALESCE(unit_cost, 0)) as cogs, SUM(CASE WHEN unit_cost IS NULL THEN 1 ELSE 0 END) as unknown_costs')
            ->whereHas('returnDoc', fn ($query) => $query->where('status', 'posted')
                ->when($startDate, fn ($query) => $query->where('return_date', '>=', $startDate))
                ->when($endDate, fn ($query) => $query->where('return_date', '<=', $endDate)))
            ->groupBy('product_variant_id')->with('variant.product')->get();
        $rows = [];
        foreach ([[$sales, 1], [$returns, -1]] as [$events, $sign]) {
            foreach ($events as $item) {
                $id = $item->product_variant_id;
                $rows[$id] ??= [
                    'variant_id' => $id, 'sku' => $item->variant?->sku ?? 'DELETED',
                    'name' => $item->variant?->name ?? 'DELETED', 'product_name' => $item->variant?->product?->name ?? 'DELETED',
                    'quantity_sold' => 0.0, 'revenue' => 0.0, 'cogs' => 0.0, 'profit' => 0.0, 'cost_history_missing' => false,
                ];
                foreach (['quantity_sold', 'revenue', 'cogs'] as $field) {
                    $rows[$id][$field] += $sign * (float) $item->{$field};
                }
                $rows[$id]['cost_history_missing'] = $rows[$id]['cost_history_missing'] || $item->unknown_costs > 0;
            }
        }

        return collect($rows)->map(function (array $row) {
            $row['revenue'] = round($row['revenue'], 4);
            $row['cogs'] = round($row['cogs'], 4);
            $row['profit'] = round($row['revenue'] - $row['cogs'], 4);

            return $row;
        })->sortByDesc('profit')->values();
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
            ->withLedgerTotals()->get()
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
            ->withLedgerTotals()->get()
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
