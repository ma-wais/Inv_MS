<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Unit;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CatalogSetupController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Inventory/Setup', [
            'categories' => Category::query()->with('parent:id,name')->orderBy('name')->get(),
            'brands' => Brand::query()->orderBy('name')->get(),
            'units' => Unit::query()->orderBy('name')->get(),
        ]);
    }

    public function storeCategory(Request $request, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer'],
            'description' => ['nullable', 'string'],
        ]);

        if ($validated['parent_id'] ?? null) {
            Category::query()->findOrFail($validated['parent_id']);
        }

        $category = Category::create([
            ...$validated,
            'slug' => $this->uniqueSlug(Category::class, $validated['name']),
        ]);
        $audit->record('category.created', $category, null, $category->toArray());

        return back()->with('status', 'Category created.');
    }

    public function storeBrand(Request $request, Audit $audit): RedirectResponse
    {
        $validated = $request->validate(['name' => ['required', 'string', 'max:255']]);
        $brand = Brand::create([
            ...$validated,
            'slug' => $this->uniqueSlug(Brand::class, $validated['name']),
        ]);
        $audit->record('brand.created', $brand, null, $brand->toArray());

        return back()->with('status', 'Brand created.');
    }

    public function storeUnit(Request $request, Audit $audit): RedirectResponse
    {
        $tenantId = $request->session()->get('tenant_id');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'symbol' => [
                'required', 'string', 'max:20',
                Rule::unique('units', 'symbol')->where('tenant_id', $tenantId),
            ],
            'allows_decimal' => ['boolean'],
        ]);

        $unit = Unit::create($validated);
        $audit->record('unit.created', $unit, null, $unit->toArray());

        return back()->with('status', 'Unit created.');
    }

    private function uniqueSlug(string $model, string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 2;

        while ($model::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
