<?php

namespace App\Http\Controllers\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Services\Purchasing\PurchaseService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $sort = $request->input('sort', 'id');
        $direction = $request->input('direction', 'desc');
        if (!in_array($direction, ['asc', 'desc'])) {
            $direction = 'desc';
        }

        $query = Purchase::query()
            ->with(['supplier:id,name', 'warehouse:id,name', 'items.variant'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', "%{$search}%")
                      ->orWhereHas('supplier', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                      ->orWhereHas('warehouse', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($startDate, function ($query, $startDate) {
                $query->whereDate('purchase_date', '>=', $startDate);
            })
            ->when($endDate, function ($query, $endDate) {
                $query->whereDate('purchase_date', '<=', $endDate);
            });

        // Apply sorting
        if ($sort === 'number') {
            $query->orderBy('number', $direction);
        } elseif ($sort === 'supplier') {
            $query->leftJoin('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
                ->select('purchases.*')
                ->orderBy('suppliers.name', $direction);
        } elseif ($sort === 'warehouse') {
            $query->leftJoin('warehouses', 'purchases.warehouse_id', '=', 'warehouses.id')
                ->select('purchases.*')
                ->orderBy('warehouses.name', $direction);
        } elseif ($sort === 'total') {
            $query->orderBy('grand_total', $direction);
        } elseif ($sort === 'outstanding') {
            $query->orderByRaw('(grand_total - paid_total) ' . $direction);
        } else {
            $query->orderBy('purchases.id', $direction);
        }

        return Inertia::render('Purchasing/Purchases/Index', [
            'purchases' => $query->paginate(20)->withQueryString(),
            'filters' => [
                'search' => $search,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'sort' => $sort,
                'direction' => $direction,
            ]
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Purchasing/Purchases/Create', [
            'suppliers' => Supplier::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'variants' => ProductVariant::query()
                ->with(['product:id,name,base_unit_id', 'product.baseUnit:id,symbol'])
                ->where('is_active', true)
                ->orderBy('sku')
                ->get(['id', 'product_id', 'name', 'sku', 'purchase_price', 'sale_price', 'reorder_level']),
        ]);
    }

    public function store(Request $request, PurchaseService $purchaseService): RedirectResponse
    {
        $validated = $request->validate([
            'supplier_id' => ['required', 'integer'],
            'warehouse_id' => ['required', 'integer'],
            'supplier_invoice_number' => ['nullable', 'string', 'max:100'],
            'purchase_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'status' => ['required', 'in:draft,ordered,received'],
            'discount_total' => ['nullable', 'numeric', 'min:0'],
            'tax_total' => ['nullable', 'numeric', 'min:0'],
            'shipping_total' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_cost' => ['required', 'numeric', 'gte:0'],
            'items.*.batch_number' => ['nullable', 'string', 'max:100'],
            'items.*.expires_at' => ['nullable', 'date'],
        ]);

        $purchase = $purchaseService->create($validated, $validated['items']);

        if ($validated['status'] === Purchase::STATUS_RECEIVED) {
            $purchaseService->receive($purchase);
        }

        return redirect()->route('purchases.show', $purchase)->with('status', 'Purchase saved.');
    }

    public function show(Purchase $purchase): Response
    {
        return Inertia::render('Purchasing/Purchases/Show', [
            'purchase' => $purchase->load(['supplier', 'warehouse', 'items.variant.product.baseUnit', 'items.batch']),
            'accounts' => Account::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function receive(Purchase $purchase, PurchaseService $purchaseService): RedirectResponse
    {
        $purchaseService->receive($purchase);

        return back()->with('status', 'Purchase received and posted to stock.');
    }
}
