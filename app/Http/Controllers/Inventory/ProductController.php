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
        $categoryId = $request->input('category_id');
        $sort = $request->input('sort', 'id');
        $direction = $request->input('direction', 'desc');
        if (!in_array($direction, ['asc', 'desc'])) {
            $direction = 'desc';
        }

        $query = Product::query()
            ->with([
                'category:id,name',
                'brand:id,name',
                'baseUnit:id,name,symbol',
                'variants' => function ($query) {
                    $query->withSum('stockBalances as stock_quantity', 'quantity');
                }
            ])
            ->withCount('variants')
            ->withSum('stockBalances as stock_quantity', 'quantity')
            ->when($categoryId, function ($query, $categoryId) {
                $query->where('products.category_id', $categoryId);
            })
            ->when($search, function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('products.name', 'like', "%{$search}%")
                        ->orWhereHas('variants', fn ($query) => $query->where('sku', 'like', "%{$search}%"))
                        ->orWhereHas('variants.barcodes', fn ($query) => $query->where('barcode', 'like', "%{$search}%"));
                });
            });

        // Apply sorting
        if ($sort === 'name') {
            $query->orderBy('products.name', $direction);
        } elseif ($sort === 'category') {
            $query->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->select('products.*')
                ->orderBy('categories.name', $direction);
        } elseif ($sort === 'brand') {
            $query->leftJoin('brands', 'products.brand_id', '=', 'brands.id')
                ->select('products.*')
                ->orderBy('brands.name', $direction);
        } elseif ($sort === 'stock') {
            $query->orderBy('stock_quantity', $direction);
        } else {
            $query->orderBy('products.id', $direction);
        }

        $products = $query->paginate(20)
            ->withQueryString()
            ->through(function (Product $product) {
                $product->image_url = $product->image_path ? \Illuminate\Support\Facades\Storage::url($product->image_path) : null;
                return $product;
            });

        return Inertia::render('Inventory/Products/Index', [
            'products' => $products,
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
                'sort' => $sort,
                'direction' => $direction,
            ],
            'categories' => Category::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'brands' => Brand::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
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
        $product->image_url = $product->image_path ? \Illuminate\Support\Facades\Storage::url($product->image_path) : null;

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
            'warehouses' => Warehouse::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function storeVariant(Request $request, int $product, Audit $audit): RedirectResponse
    {
        $product = Product::query()->findOrFail($product);
        $tenantId = $request->session()->get('tenant_id');

        $sku = trim((string) $request->input('sku'));
        if ($sku === '') {
            do {
                $sku = 'SKU-' . strtoupper(Str::random(8));
            } while (DB::table('product_variants')->where('tenant_id', $tenantId)->where('sku', $sku)->exists());
            $request->merge(['sku' => $sku]);
        }

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
            'opening_stock' => ['nullable', 'numeric', 'min:0'],
            'warehouse_id' => ['nullable', 'required_if:opening_stock,>0', 'integer'],
        ]);

        if (($validated['barcode'] ?? null) && ProductUnitConversion::query()->where('tenant_id', $tenantId)->where('barcode', $validated['barcode'])->exists()) {
            throw ValidationException::withMessages(['barcode' => 'This barcode is already used by a unit conversion.']);
        }

        $variant = DB::transaction(function () use ($product, $validated, $audit) {
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

            if (($validated['opening_stock'] ?? 0) > 0) {
                $warehouse = Warehouse::query()->findOrFail($validated['warehouse_id']);
                app(StockMovementService::class)->record(
                    $warehouse,
                    $variant,
                    'opening',
                    $validated['opening_stock'],
                    unitCost: $validated['purchase_price'],
                    reference: $product,
                    referenceNumber: $variant->sku,
                    note: 'Opening stock entered during variant creation.',
                );

                app(\App\Services\Accounting\AutomaticPostingService::class)->postOpeningStock(
                    $variant,
                    (float) $validated['opening_stock'],
                    (float) $validated['purchase_price']
                );
            }

            return $variant;
        });

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

        // Pre-process blank SKUs in variants
        $variantsData = $request->input('variants', []);
        if (is_array($variantsData)) {
            foreach ($variantsData as $index => $variant) {
                $sku = trim((string) ($variant['sku'] ?? ''));
                if ($sku === '') {
                    do {
                        $sku = 'SKU-' . strtoupper(Str::random(8));
                    } while (DB::table('product_variants')->where('tenant_id', $tenantId)->where('sku', $sku)->exists());
                    $variantsData[$index]['sku'] = $sku;
                }
            }
            $request->merge(['variants' => $variantsData]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer'],
            'brand_id' => ['nullable', 'integer'],
            'base_unit_id' => ['required', 'integer'],
            'product_type' => ['required', 'in:standard,paint,medicine'],
            'description' => ['nullable', 'string'],
            'track_batches' => ['boolean'],
            'track_expiry' => ['boolean'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.name' => ['required', 'string', 'max:255'],
            'variants.*.sku' => [
                'required', 'string', 'max:100',
                Rule::unique('product_variants', 'sku')->where('tenant_id', $tenantId),
            ],
            'variants.*.barcode' => [
                'nullable', 'string', 'max:100',
                Rule::unique('product_barcodes', 'barcode')->where('tenant_id', $tenantId),
            ],
            'variants.*.purchase_price' => ['required', 'numeric', 'min:0'],
            'variants.*.sale_price' => ['required', 'numeric', 'min:0'],
            'variants.*.reorder_level' => ['nullable', 'numeric', 'min:0'],
            'variants.*.opening_stock' => ['nullable', 'numeric', 'min:0'],
            'variants.*.warehouse_id' => ['nullable', 'integer'],
            'image' => ['nullable', 'image', 'max:2048'], // Max 2MB
        ]);

        // Check for duplicate SKUs or Barcodes within the submitted array
        $skus = array_filter(array_column($validated['variants'], 'sku'));
        if (count($skus) !== count(array_unique($skus))) {
            throw ValidationException::withMessages(['variants' => 'Duplicate SKUs are not allowed.']);
        }
        $barcodes = array_filter(array_column($validated['variants'], 'barcode'));
        if (count($barcodes) !== count(array_unique($barcodes))) {
            throw ValidationException::withMessages(['variants' => 'Duplicate barcodes are not allowed.']);
        }
        foreach ($barcodes as $barcode) {
            if (ProductUnitConversion::query()->where('tenant_id', $tenantId)->where('barcode', $barcode)->exists()) {
                throw ValidationException::withMessages(['variants' => "Barcode {$barcode} is already used by a unit conversion."]);
            }
        }

        $category = isset($validated['category_id']) ? Category::query()->findOrFail($validated['category_id']) : null;
        $brand = isset($validated['brand_id']) ? Brand::query()->findOrFail($validated['brand_id']) : null;
        $unit = Unit::query()->findOrFail($validated['base_unit_id']);

        $product = DB::transaction(function () use (
            $validated,
            $category,
            $brand,
            $unit,
            $stockMovementService,
            $audit,
            $request
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

            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('products', 'public');
                $product->update(['image_path' => $path]);
            }

            foreach ($validated['variants'] as $vData) {
                $variant = $product->variants()->create([
                    'tenant_id' => $product->tenant_id,
                    'name' => $vData['name'],
                    'sku' => $vData['sku'],
                    'purchase_price' => $vData['purchase_price'],
                    'sale_price' => $vData['sale_price'],
                    'reorder_level' => $vData['reorder_level'] ?? 0,
                ]);

                if ($vData['barcode'] ?? null) {
                    ProductBarcode::create([
                        'product_variant_id' => $variant->id,
                        'barcode' => $vData['barcode'],
                        'is_primary' => true,
                    ]);
                }

                if (($vData['opening_stock'] ?? 0) > 0) {
                    if (empty($vData['warehouse_id'])) {
                        throw ValidationException::withMessages(['variants' => 'Select a warehouse for opening stock.']);
                    }
                    $warehouse = Warehouse::query()->findOrFail($vData['warehouse_id']);
                    $stockMovementService->record(
                        $warehouse,
                        $variant,
                        'opening',
                        $vData['opening_stock'],
                        unitCost: $vData['purchase_price'],
                        reference: $product,
                        referenceNumber: $variant->sku,
                        note: 'Opening stock entered during product creation.',
                    );

                    app(\App\Services\Accounting\AutomaticPostingService::class)->postOpeningStock(
                        $variant,
                        (float) $vData['opening_stock'],
                        (float) $vData['purchase_price']
                    );
                }
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

    public function update(Request $request, int $id, Audit $audit): RedirectResponse
    {
        $product = Product::query()->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer'],
            'brand_id' => ['nullable', 'integer'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'image' => ['nullable', 'image', 'max:2048'], // Max 2MB
        ]);

        $old = $product->toArray();
        
        $data = [
            'name' => $validated['name'],
            'category_id' => $validated['category_id'] ?? null,
            'brand_id' => $validated['brand_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'],
        ];

        if ($request->hasFile('image')) {
            if ($product->image_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($product->image_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($product->image_path);
            }
            $path = $request->file('image')->store('products', 'public');
            $data['image_path'] = $path;
        }

        $product->update($data);
        $audit->record('product.updated', $product, $old, $product->toArray());

        return back()->with('status', 'Product details updated successfully.');
    }

    public function destroy(int $id, Audit $audit): RedirectResponse
    {
        $product = Product::query()->findOrFail($id);

        $variantIds = $product->variants()->pluck('id');
        $hasMovements = DB::table('stock_movements')->whereIn('product_variant_id', $variantIds)->exists();

        if ($hasMovements) {
            return back()->withErrors(['error' => 'This product has active stock transactions and cannot be deleted. You can deactivate it instead.']);
        }

        $old = $product->toArray();
        DB::transaction(function () use ($product, $variantIds) {
            DB::table('product_barcodes')->whereIn('product_variant_id', $variantIds)->delete();
            DB::table('stock_balances')->whereIn('product_variant_id', $variantIds)->delete();
            $product->unitConversions()->delete();
            $product->variants()->delete();
            $product->delete();
        });

        $audit->record('product.deleted', null, $old, null);

        return redirect()->route('products.index')->with('status', 'Product deleted successfully.');
    }

    public function destroyVariant(Request $request, int $productId, int $variantId, Audit $audit): RedirectResponse
    {
        $product = Product::query()->findOrFail($productId);
        $variant = $product->variants()->findOrFail($variantId);

        if ($product->variants()->count() <= 1) {
            return back()->withErrors(['error' => 'A product must have at least one variant.']);
        }

        $hasMovements = DB::table('stock_movements')->where('product_variant_id', $variant->id)->exists()
            || DB::table('purchase_items')->where('product_variant_id', $variant->id)->exists()
            || DB::table('sale_items')->where('product_variant_id', $variant->id)->exists()
            || DB::table('purchase_return_items')->where('product_variant_id', $variant->id)->exists()
            || DB::table('sale_return_items')->where('product_variant_id', $variant->id)->exists();

        if ($hasMovements) {
            return back()->withErrors(['error' => 'This variant has active transactions and cannot be deleted.']);
        }

        $old = $variant->toArray();
        DB::transaction(function () use ($variant) {
            DB::table('product_barcodes')->where('product_variant_id', $variant->id)->delete();
            DB::table('stock_balances')->where('product_variant_id', $variant->id)->delete();
            $variant->delete();
        });

        $audit->record('product.variant.deleted', null, $old, null);

        return back()->with('status', 'Variant deleted successfully.');
    }

    public function updateVariant(Request $request, int $productId, int $variantId, Audit $audit): RedirectResponse
    {
        $product = Product::query()->findOrFail($productId);
        $variant = $product->variants()->findOrFail($variantId);
        $tenantId = $request->session()->get('tenant_id');

        $sku = trim((string) $request->input('sku'));
        if ($sku === '') {
            do {
                $sku = 'SKU-' . strtoupper(Str::random(8));
            } while (DB::table('product_variants')->where('tenant_id', $tenantId)->where('sku', $sku)->exists());
            $request->merge(['sku' => $sku]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => [
                'required', 'string', 'max:100',
                Rule::unique('product_variants', 'sku')->ignore($variant->id)->where('tenant_id', $tenantId),
            ],
            'barcode' => [
                'nullable', 'string', 'max:100',
                Rule::unique('product_barcodes', 'barcode')->ignore($variant->barcodes()->first()?->id)->where('tenant_id', $tenantId),
            ],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'reorder_level' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (($validated['barcode'] ?? null) && ProductUnitConversion::query()->where('tenant_id', $tenantId)->where('barcode', $validated['barcode'])->exists()) {
            throw ValidationException::withMessages(['barcode' => 'This barcode is already used by a unit conversion.']);
        }

        $old = $variant->toArray();
        DB::transaction(function () use ($variant, $validated) {
            $variant->update([
                'name' => $validated['name'],
                'sku' => $validated['sku'],
                'purchase_price' => $validated['purchase_price'],
                'sale_price' => $validated['sale_price'],
                'reorder_level' => $validated['reorder_level'] ?? 0,
            ]);

            if ($validated['barcode'] ?? null) {
                $variant->barcodes()->updateOrCreate(
                    [],
                    ['barcode' => $validated['barcode'], 'is_primary' => true]
                );
            } else {
                $variant->barcodes()->delete();
            }
        });

        $audit->record('product.variant.updated', $variant, $old, $variant->toArray());

        return back()->with('status', 'Variant updated successfully.');
    }
}

