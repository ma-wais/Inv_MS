<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductBarcode;
use App\Models\ProductUnitConversion;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Services\Inventory\StockMovementService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));

        $products = Product::query()
            ->with(['category:id,name', 'brand:id,name', 'baseUnit:id,name,symbol'])
            ->withCount('variants')
            ->withSum('stockBalances as stock_quantity', 'quantity')
            ->when($search, function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhereHas('variants', fn ($query) => $query->where('sku', 'like', "%{$search}%"))
                        ->orWhereHas('variants.barcodes', fn ($query) => $query->where('barcode', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Inventory/Products/Index', [
            'products' => $products,
            'filters' => ['search' => $search],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Inventory/Products/Create', [
            'categories' => Category::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'brands' => Brand::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'units' => Unit::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'symbol']),
            'warehouses' => Warehouse::query()->where('is_active', true)->orderByDesc('is_default')->get(['id', 'name']),
        ]);
    }

    public function show(int $product): Response
    {
        $product = Product::query()->findOrFail($product);

        return Inertia::render('Inventory/Products/Show', [
            'product' => $product->load([
                'category:id,name',
                'brand:id,name',
                'baseUnit:id,name,symbol',
                'variants.barcodes',
                'variants.stockBalances.warehouse:id,name',
                'unitConversions.unit:id,name,symbol',
            ]),
            'units' => Unit::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'symbol']),
        ]);
    }

    public function storeVariant(Request $request, int $product, Audit $audit): RedirectResponse
    {
        $product = Product::query()->findOrFail($product);
        $tenantId = $request->session()->get('tenant_id');
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => [
                'required', 'string', 'max:100',
                Rule::unique('product_variants', 'sku')->where('tenant_id', $tenantId),
            ],
            'barcode' => [
                'nullable', 'string', 'max:100',
                Rule::unique('product_barcodes', 'barcode')->where('tenant_id', $tenantId),
            ],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'reorder_level' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (($validated['barcode'] ?? null) && ProductUnitConversion::query()->where('tenant_id', $tenantId)->where('barcode', $validated['barcode'])->exists()) {
            throw ValidationException::withMessages(['barcode' => 'This barcode is already used by a unit conversion.']);
        }

        $variant = $product->variants()->create([
            'tenant_id' => $product->tenant_id,
            'name' => $validated['name'],
            'sku' => $validated['sku'],
            'purchase_price' => $validated['purchase_price'],
            'sale_price' => $validated['sale_price'],
            'reorder_level' => $validated['reorder_level'] ?? 0,
        ]);

        if ($validated['barcode'] ?? null) {
            ProductBarcode::create([
                'product_variant_id' => $variant->id,
                'barcode' => $validated['barcode'],
                'is_primary' => true,
            ]);
        }

        $audit->record('product.variant.created', $variant, null, $variant->toArray());

        return back()->with('status', 'Variant created.');
    }

    public function storeUnitConversion(Request $request, int $product, Audit $audit): RedirectResponse
    {
        $product = Product::query()->findOrFail($product);
        $tenantId = $request->session()->get('tenant_id');
        $validated = $request->validate([
            'unit_id' => [
                'required', 'integer',
                Rule::unique('product_unit_conversions', 'unit_id')
                    ->where('tenant_id', $tenantId)
                    ->where('product_id', $product->id),
            ],
            'base_quantity' => ['required', 'numeric', 'gt:0'],
            'barcode' => [
                'nullable', 'string', 'max:100',
                Rule::unique('product_unit_conversions', 'barcode')->where('tenant_id', $tenantId),
            ],
        ]);

        Unit::query()->findOrFail($validated['unit_id']);

        if ((int) $validated['unit_id'] === $product->base_unit_id) {
            throw ValidationException::withMessages(['unit_id' => 'Choose a unit other than the product base unit.']);
        }

        if (($validated['barcode'] ?? null) && ProductBarcode::query()->where('tenant_id', $tenantId)->where('barcode', $validated['barcode'])->exists()) {
            throw ValidationException::withMessages(['barcode' => 'This barcode is already used by a product variant.']);
        }

        $conversion = ProductUnitConversion::create([
            'product_id' => $product->id,
            ...$validated,
        ]);
        $audit->record('product.unit_conversion.created', $conversion, null, $conversion->toArray());

        return back()->with('status', 'Unit conversion created.');
    }

    public function store(
        Request $request,
        StockMovementService $stockMovementService,
        Audit $audit,
    ): RedirectResponse {
        $tenantId = $request->session()->get('tenant_id');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer'],
            'brand_id' => ['nullable', 'integer'],
            'base_unit_id' => ['required', 'integer'],
            'product_type' => ['required', 'in:standard,paint,medicine'],
            'description' => ['nullable', 'string'],
            'track_batches' => ['boolean'],
            'track_expiry' => ['boolean'],
            'variant_name' => ['required', 'string', 'max:255'],
            'sku' => [
                'required', 'string', 'max:100',
                Rule::unique('product_variants', 'sku')->where('tenant_id', $tenantId),
            ],
            'barcode' => [
                'nullable', 'string', 'max:100',
                Rule::unique('product_barcodes', 'barcode')->where('tenant_id', $tenantId),
            ],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'reorder_level' => ['nullable', 'numeric', 'min:0'],
            'opening_stock' => ['nullable', 'numeric', 'min:0'],
            'warehouse_id' => ['nullable', 'integer'],
        ]);

        $category = isset($validated['category_id']) ? Category::query()->findOrFail($validated['category_id']) : null;
        $brand = isset($validated['brand_id']) ? Brand::query()->findOrFail($validated['brand_id']) : null;
        $unit = Unit::query()->findOrFail($validated['base_unit_id']);
        $warehouse = isset($validated['warehouse_id']) ? Warehouse::query()->findOrFail($validated['warehouse_id']) : null;

        if (($validated['opening_stock'] ?? 0) > 0 && $warehouse === null) {
            throw ValidationException::withMessages(['warehouse_id' => 'Select a warehouse for opening stock.']);
        }

        if (($validated['barcode'] ?? null) && ProductUnitConversion::query()->where('tenant_id', $tenantId)->where('barcode', $validated['barcode'])->exists()) {
            throw ValidationException::withMessages(['barcode' => 'This barcode is already used by a unit conversion.']);
        }

        $product = DB::transaction(function () use (
            $validated,
            $category,
            $brand,
            $unit,
            $warehouse,
            $stockMovementService,
            $audit,
        ): Product {
            $product = Product::create([
                'category_id' => $category?->id,
                'brand_id' => $brand?->id,
                'base_unit_id' => $unit->id,
                'name' => $validated['name'],
                'slug' => $this->uniqueSlug($validated['name']),
                'product_type' => $validated['product_type'],
                'description' => $validated['description'] ?? null,
                'track_batches' => $validated['track_batches'] ?? false,
                'track_expiry' => $validated['track_expiry'] ?? false,
            ]);

            $variant = $product->variants()->create([
                'tenant_id' => $product->tenant_id,
                'name' => $validated['variant_name'],
                'sku' => $validated['sku'],
                'purchase_price' => $validated['purchase_price'],
                'sale_price' => $validated['sale_price'],
                'reorder_level' => $validated['reorder_level'] ?? 0,
            ]);

            if ($validated['barcode'] ?? null) {
                ProductBarcode::create([
                    'product_variant_id' => $variant->id,
                    'barcode' => $validated['barcode'],
                    'is_primary' => true,
                ]);
            }

            if (($validated['opening_stock'] ?? 0) > 0) {
                $stockMovementService->record(
                    $warehouse,
                    $variant,
                    'opening',
                    $validated['opening_stock'],
                    unitCost: $validated['purchase_price'],
                    reference: $product,
                    referenceNumber: $variant->sku,
                    note: 'Opening stock entered during product creation.',
                );
            }

            $audit->record('product.created', $product, null, $product->toArray());

            return $product;
        });

        return redirect()->route('products.index')->with('status', "{$product->name} created.");
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 2;

        while (Product::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
