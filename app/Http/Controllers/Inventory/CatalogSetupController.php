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
        $tenantId = $request->session()->get('tenant_id');
        $name = trim((string) $request->input('name'));
        $request->merge(['name' => $name]);

        $exists = Category::query()
            ->where('tenant_id', $tenantId)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->exists();

        if ($exists) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'name' => 'The category name has already been taken.'
            ]);
        }

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
        $tenantId = $request->session()->get('tenant_id');
        $name = trim((string) $request->input('name'));
        $request->merge(['name' => $name]);

        $exists = Brand::query()
            ->where('tenant_id', $tenantId)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->exists();

        if ($exists) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'name' => 'The brand name has already been taken.'
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255']
        ]);
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
        $name = trim((string) $request->input('name'));
        $symbol = trim((string) $request->input('symbol'));
        $request->merge(['name' => $name, 'symbol' => $symbol]);

        $nameExists = Unit::query()
            ->where('tenant_id', $tenantId)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->exists();

        if ($nameExists) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'name' => 'The unit name has already been taken.'
            ]);
        }

        $symbolExists = Unit::query()
            ->where('tenant_id', $tenantId)
            ->whereRaw('LOWER(symbol) = ?', [strtolower($symbol)])
            ->exists();

        if ($symbolExists) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'symbol' => 'The unit symbol has already been taken.'
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['required', 'string', 'max:20'],
            'allows_decimal' => ['boolean'],
        ]);

        $unit = Unit::create($validated);
        $audit->record('unit.created', $unit, null, $unit->toArray());

        return back()->with('status', 'Unit created.');
    }

    public function updateCategory(Request $request, int $id, Audit $audit): RedirectResponse
    {
        $category = Category::query()->findOrFail($id);
        $tenantId = $request->session()->get('tenant_id');
        $name = trim((string) $request->input('name'));
        $request->merge(['name' => $name]);

        $exists = Category::query()
            ->where('tenant_id', $tenantId)
            ->where('id', '!=', $category->id)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->exists();

        if ($exists) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'name' => 'The category name has already been taken.'
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer'],
            'description' => ['nullable', 'string'],
        ]);

        if (($validated['parent_id'] ?? null) == $category->id) {
            throw \Illuminate\Validation\ValidationException::withMessages(['parent_id' => 'A category cannot be its own parent.']);
        }

        $old = $category->toArray();
        $category->update($validated);
        $audit->record('category.updated', $category, $old, $category->toArray());

        return back()->with('status', 'Category updated successfully.');
    }

    public function destroyCategory(int $id, Audit $audit): RedirectResponse
    {
        $category = Category::query()->findOrFail($id);

        if ($category->products()->exists() || Category::query()->where('parent_id', $category->id)->exists()) {
            return back()->withErrors(['error' => 'This category is in use and cannot be deleted.']);
        }

        $old = $category->toArray();
        $category->delete();
        $audit->record('category.deleted', null, $old, null);

        return back()->with('status', 'Category deleted successfully.');
    }

    public function updateBrand(Request $request, int $id, Audit $audit): RedirectResponse
    {
        $brand = Brand::query()->findOrFail($id);
        $tenantId = $request->session()->get('tenant_id');
        $name = trim((string) $request->input('name'));
        $request->merge(['name' => $name]);

        $exists = Brand::query()
            ->where('tenant_id', $tenantId)
            ->where('id', '!=', $brand->id)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->exists();

        if ($exists) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'name' => 'The brand name has already been taken.'
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $old = $brand->toArray();
        $brand->update($validated);
        $audit->record('brand.updated', $brand, $old, $brand->toArray());

        return back()->with('status', 'Brand updated successfully.');
    }

    public function destroyBrand(int $id, Audit $audit): RedirectResponse
    {
        $brand = Brand::query()->findOrFail($id);

        if ($brand->products()->exists()) {
            return back()->withErrors(['error' => 'This brand is in use and cannot be deleted.']);
        }

        $old = $brand->toArray();
        $brand->delete();
        $audit->record('brand.deleted', null, $old, null);

        return back()->with('status', 'Brand deleted successfully.');
    }

    public function updateUnit(Request $request, int $id, Audit $audit): RedirectResponse
    {
        $unit = Unit::query()->findOrFail($id);
        $tenantId = $request->session()->get('tenant_id');
        $name = trim((string) $request->input('name'));
        $symbol = trim((string) $request->input('symbol'));
        $request->merge(['name' => $name, 'symbol' => $symbol]);

        $nameExists = Unit::query()
            ->where('tenant_id', $tenantId)
            ->where('id', '!=', $unit->id)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->exists();

        if ($nameExists) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'name' => 'The unit name has already been taken.'
            ]);
        }

        $symbolExists = Unit::query()
            ->where('tenant_id', $tenantId)
            ->where('id', '!=', $unit->id)
            ->whereRaw('LOWER(symbol) = ?', [strtolower($symbol)])
            ->exists();

        if ($symbolExists) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'symbol' => 'The unit symbol has already been taken.'
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['required', 'string', 'max:20'],
            'allows_decimal' => ['boolean'],
        ]);

        $old = $unit->toArray();
        $unit->update($validated);
        $audit->record('unit.updated', $unit, $old, $unit->toArray());

        return back()->with('status', 'Unit updated successfully.');
    }

    public function destroyUnit(int $id, Audit $audit): RedirectResponse
    {
        $unit = Unit::query()->findOrFail($id);

        if ($unit->products()->exists() || \Illuminate\Support\Facades\DB::table('product_unit_conversions')->where('unit_id', $unit->id)->exists()) {
            return back()->withErrors(['error' => 'This unit is in use and cannot be deleted.']);
        }

        $old = $unit->toArray();
        $unit->delete();
        $audit->record('unit.deleted', null, $old, null);

        return back()->with('status', 'Unit deleted successfully.');
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
