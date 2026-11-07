<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Services\Sales\SaleService;
use App\Support\Auditing\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $sort = $request->input('sort', 'id');
        $direction = $request->input('direction', 'desc');
        if (! in_array($direction, ['asc', 'desc'])) {
            $direction = 'desc';
        }

        $query = Sale::query()
            ->with(['customer:id,name', 'warehouse:id,name'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('warehouse', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($startDate, function ($query, $startDate) {
                $query->whereDate('sale_date', '>=', $startDate);
            })
            ->when($endDate, function ($query, $endDate) {
                $query->whereDate('sale_date', '<=', $endDate);
            });

        // Apply sorting
        if ($sort === 'number') {
            $query->orderBy('number', $direction);
        } elseif ($sort === 'customer') {
            $query->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
                ->select('sales.*')
                ->orderBy('customers.name', $direction);
        } elseif ($sort === 'warehouse') {
            $query->leftJoin('warehouses', 'sales.warehouse_id', '=', 'warehouses.id')
                ->select('sales.*')
                ->orderBy('warehouses.name', $direction);
        } elseif ($sort === 'total') {
            $query->orderBy('grand_total', $direction);
        } elseif ($sort === 'outstanding') {
            $query->orderByRaw('(grand_total - paid_total - (SELECT COALESCE(SUM(total), 0) FROM sale_returns WHERE sale_id = sales.id AND tenant_id = sales.tenant_id AND status = ?)) '.$direction, ['posted']);
        } else {
            $query->orderBy('sales.id', $direction);
        }

        return Inertia::render('Sales/Sales/Index', [
            'sales' => $query->withReturnTotals()->paginate(20)->withQueryString(),
            'filters' => [
                'search' => $search,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    public function create(): Response
    {
        $walkInCustomer = Customer::firstOrCreate(
            ['code' => 'WALKIN'],
            [
                'name' => 'Walk-in Customer',
                'is_active' => true,
                'credit_limit' => 0,
                'opening_balance' => 0,
            ]
        );

        return Inertia::render('Sales/POS/Create', [
            'walk_in_customer_id' => $walkInCustomer->id,
            'customers' => Customer::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'phone'])->each->setAppends([]),
            'warehouses' => Warehouse::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'accounts' => Account::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'name']),
            'variants' => $this->catalogVariants(),
            'product_types' => Product::query()->where('is_active', true)->distinct()->pluck('product_type'),
        ]);
    }

    public function catalog(Request $request): JsonResponse
    {
        // Searching must not age the success/error flash data of a parallel form request.
        $request->session()->reflash();
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:50'],
        ]);

        return response()->json(['variants' => $this->catalogVariants(trim($validated['search'] ?? ''), $validated['category'] ?? null)]);
    }

    private function catalogVariants(string $search = '', ?string $category = null)
    {
        return ProductVariant::query()->with([
            'product:id,name,base_unit_id,product_type,track_batches,category_id,brand_id',
            'product.baseUnit:id,symbol,allows_decimal',
            'product.category:id,name', 'product.brand:id,name',
            'stockBalances:id,product_variant_id,warehouse_id,product_batch_id,quantity',
            'stockBalances.batch:id,batch_number,expires_at',
            'barcodes:id,product_variant_id,barcode',
        ])->where('is_active', true)->whereHas('product', fn ($query) => $query->where('is_active', true))
            ->when($category && $category !== 'all', fn ($query) => $query->whereHas('product', fn ($query) => $query->where('product_type', $category)))
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('sku', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%")
                    ->orWhereHas('barcodes', fn ($query) => $query->where('barcode', 'like', "%{$search}%"))
                    ->orWhereHas('product', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('product.category', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('product.brand', fn ($query) => $query->where('name', 'like', "%{$search}%"));
            }))->orderBy('sku')->limit(60)->get();
    }

    public function store(Request $request, SaleService $saleService, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'integer'],
            'warehouse_id' => ['required', 'integer'],
            'invoice_number' => ['nullable', 'string', 'max:100'],
            'sale_date' => ['required', 'date'],
            'status' => ['required', 'in:draft,posted'],
            'discount_total' => ['nullable', 'numeric', 'min:0'],
            'tax_total' => ['nullable', 'numeric', 'min:0'],
            'shipping_total' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'integer'],
            'items.*.product_batch_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'gte:0'],

            // Payment details
            'payment_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'in:cash,bank,card,mobile'],
            'payments' => ['nullable', 'array', 'max:4'],
            'payments.*.amount' => ['required', 'numeric', 'min:0'],
            'payments.*.method' => ['required', 'in:cash,bank,card,mobile'],
            'payments.*.account_id' => ['nullable', 'integer'],
            'payments.*.reference' => ['nullable', 'string', 'max:100'],
            'payment_account_id' => ['nullable', 'integer'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $sale = $saleService->checkout($validated, $validated['items']);
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['checkout' => $exception->getMessage()]);
        }

        $audit->record('sale.created', $sale, null, $sale->toArray());

        return redirect()->route('sales.show', [$sale, 'print' => 'true'])->with('status', 'Sale saved.');
    }

    public function show(Sale $sale): Response
    {
        return Inertia::render('Sales/Sales/Show', [
            'sale' => $sale->loadSum(['returns as returns_total' => fn ($query) => $query->where('status', 'posted')], 'total')->load(['customer', 'warehouse', 'items.variant.product.baseUnit', 'items.batch']),
            'accounts' => Account::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }
}
