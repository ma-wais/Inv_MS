<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Services\Inventory\StockMovementService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class StockController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $warehouseId = $request->query('warehouse_id');
        $variantId = $request->query('product_variant_id');

        $balancesQuery = StockBalance::query()
            ->where('quantity', '>', 0)
            ->with([
                'variant:id,product_id,name,sku,reorder_level',
                'variant.product:id,name,base_unit_id',
                'variant.product.baseUnit:id,symbol',
                'warehouse:id,name',
                'batch:id,batch_number,expires_at',
            ]);

        $movementsQuery = StockMovement::query()
            ->with(['variant:id,product_id,name,sku', 'variant.product:id,name', 'warehouse:id,name']);

        if ($search) {
            $balancesQuery->whereHas('variant', function ($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%");
                  });
            });
            $movementsQuery->whereHas('variant', function ($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($warehouseId) {
            $balancesQuery->where('warehouse_id', $warehouseId);
            $movementsQuery->where('warehouse_id', $warehouseId);
        }

        if ($variantId) {
            $balancesQuery->where('product_variant_id', $variantId);
            $movementsQuery->where('product_variant_id', $variantId);
        }

        return Inertia::render('Inventory/Stock/Index', [
            'balances' => $balancesQuery->orderBy('quantity')->get(),
            'movements' => $movementsQuery->latest('occurred_at')->limit(100)->get(),
            'filters' => [
                'search' => $search ?? '',
                'warehouse_id' => $warehouseId ?? '',
                'product_variant_id' => $variantId ?? '',
            ],
            'variants' => ProductVariant::query()
                ->with('product:id,name')
                ->where('is_active', true)
                ->orderBy('sku')
                ->get(['id', 'product_id', 'name', 'sku']),
            'lowStock' => ProductVariant::query()
                ->with(['product:id,name,base_unit_id', 'product.baseUnit:id,symbol'])
                ->withSum('stockBalances as stock_quantity', 'quantity')
                ->where('is_active', true)
                ->whereRaw(
                    '(SELECT COALESCE(SUM(stock_balances.quantity), 0)
                    FROM stock_balances
                    WHERE stock_balances.product_variant_id = product_variants.id
                    AND stock_balances.tenant_id = product_variants.tenant_id)
                    <= product_variants.reorder_level'
                )
                ->orderBy('sku')
                ->get(['id', 'product_id', 'name', 'sku', 'reorder_level']),
            'warehouses' => Warehouse::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function adjust(
        Request $request,
        StockMovementService $stockMovementService,
        Audit $audit,
    ): RedirectResponse {
        $validated = $request->validate([
            'warehouse_id' => ['required', 'integer'],
            'product_variant_id' => ['required', 'integer'],
            'quantity' => ['required', 'numeric', 'not_in:0'],
            'note' => ['required', 'string', 'max:1000'],
        ]);

        $warehouse = Warehouse::query()->findOrFail($validated['warehouse_id']);
        $variant = ProductVariant::query()->findOrFail($validated['product_variant_id']);

        try {
            $movement = $stockMovementService->record(
                $warehouse,
                $variant,
                StockMovement::TYPE_ADJUSTMENT,
                $validated['quantity'],
                note: $validated['note'],
            );
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['quantity' => $exception->getMessage()]);
        }

        $audit->record('stock.adjusted', $movement, null, $movement->toArray());

        return back()->with('status', 'Stock adjustment recorded.');
    }
}
