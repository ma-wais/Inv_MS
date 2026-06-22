<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProductVariantFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_product_with_multiple_variants_and_optional_skus(): void
    {
        $this->withoutExceptionHandling();
        $tenant = Tenant::create([
            'name' => 'Demo Shop',
            'slug' => 'demo-shop',
            'currency' => 'PKR',
            'timezone' => 'Asia/Karachi',
        ]);

        $user = User::create([
            'name' => 'Owner',
            'email' => 'owner@test.local',
            'password' => Hash::make('password'),
            'is_super_admin' => true,
        ]);
        $tenant->users()->attach($user->id, ['role' => 'owner', 'is_default' => true]);
        $this->actingAs($user);

        $context = app(TenantContext::class);
        $context->set($tenant);
        session(['tenant_id' => $tenant->id]);
        $this->seedDefaultAccounts($tenant);

        $unit = Unit::create(['tenant_id' => $tenant->id, 'name' => 'Piece', 'symbol' => 'pc', 'allows_decimal' => false]);
        $category = Category::create(['tenant_id' => $tenant->id, 'name' => 'Paint', 'slug' => 'paint']);
        $brand = Brand::create(['tenant_id' => $tenant->id, 'name' => 'Demo Colors', 'slug' => 'demo-colors']);
        $branch = $tenant->branches()->create(['name' => 'Main', 'code' => 'MAIN', 'is_default' => true]);
        $warehouse = $branch->warehouses()->create(['tenant_id' => $tenant->id, 'name' => 'Main Warehouse', 'code' => 'MAIN-WH', 'is_default' => true]);

        // Post request to store product with two variants
        $response = $this->withSession(['tenant_id' => $tenant->id])->post(route('products.store'), [
            'name' => 'Test Paint',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'base_unit_id' => $unit->id,
            'product_type' => 'paint',
            'description' => 'Test paint description',
            'variants' => [
                [
                    'name' => 'Variant One',
                    'sku' => '', // blank SKU to test auto-generation
                    'barcode' => 'BARCODE1',
                    'purchase_price' => 10,
                    'sale_price' => 20,
                    'reorder_level' => 2,
                    'opening_stock' => 5,
                    'warehouse_id' => $warehouse->id,
                ],
                [
                    'name' => 'Variant Two',
                    'sku' => 'CUSTOM-SKU-99', // custom SKU
                    'barcode' => 'BARCODE2',
                    'purchase_price' => 15,
                    'sale_price' => 25,
                    'reorder_level' => 3,
                    'opening_stock' => 0,
                    'warehouse_id' => $warehouse->id,
                ]
            ]
        ]);

        $response->dump();
        $response->assertRedirect(route('products.index'));

        $product = Product::where('name', 'Test Paint')->firstOrFail();
        $this->assertCount(2, $product->variants);

        $v1 = $product->variants->where('name', 'Variant One')->first();
        $this->assertNotNull($v1);
        $this->assertStringStartsWith('SKU-', $v1->sku); // Verify auto-generated SKU
        $this->assertSame(10.0, (float) $v1->purchase_price);

        $v2 = $product->variants->where('name', 'Variant Two')->first();
        $this->assertNotNull($v2);
        $this->assertSame('CUSTOM-SKU-99', $v2->sku); // Verify custom SKU
    }

    public function test_can_delete_variant_when_no_movements(): void
    {
        $tenant = Tenant::create([
            'name' => 'Demo Shop',
            'slug' => 'demo-shop',
            'currency' => 'PKR',
            'timezone' => 'Asia/Karachi',
        ]);

        $user = User::create([
            'name' => 'Owner',
            'email' => 'owner@test.local',
            'password' => Hash::make('password'),
            'is_super_admin' => true,
        ]);
        $tenant->users()->attach($user->id, ['role' => 'owner', 'is_default' => true]);
        $this->actingAs($user);

        $context = app(TenantContext::class);
        $context->set($tenant);
        session(['tenant_id' => $tenant->id]);

        $unit = Unit::create(['tenant_id' => $tenant->id, 'name' => 'Piece', 'symbol' => 'pc', 'allows_decimal' => false]);
        $product = Product::create([
            'tenant_id' => $tenant->id,
            'name' => 'Test Paint',
            'slug' => 'test-paint',
            'base_unit_id' => $unit->id,
        ]);

        $v1 = $product->variants()->create([
            'tenant_id' => $tenant->id,
            'name' => '5L',
            'sku' => 'SKU-5L',
            'purchase_price' => 10,
            'sale_price' => 20,
        ]);

        $v2 = $product->variants()->create([
            'tenant_id' => $tenant->id,
            'name' => '10L',
            'sku' => 'SKU-10L',
            'purchase_price' => 15,
            'sale_price' => 25,
        ]);

        // Delete v2
        $response = $this->delete(route('products.variants.destroy', [$product->id, $v2->id]));
        $response->assertRedirect();
        
        $this->assertDatabaseMissing('product_variants', ['id' => $v2->id]);
        $this->assertDatabaseHas('product_variants', ['id' => $v1->id]);

        // Attempting to delete the last variant (v1) should fail
        $response2 = $this->delete(route('products.variants.destroy', [$product->id, $v1->id]));
        $response2->assertSessionHasErrors(['error']);
        $this->assertDatabaseHas('product_variants', ['id' => $v1->id]);
    }

    private function seedDefaultAccounts(Tenant $tenant): void
    {
        $assets = $tenant->accounts()->create(['code' => '1000', 'name' => 'Assets', 'type' => \App\Models\Account::TYPE_ASSET, 'normal_balance' => 'debit', 'is_system' => true]);
        $tenant->accounts()->create(['code' => '3000', 'name' => 'Equity', 'type' => \App\Models\Account::TYPE_EQUITY, 'normal_balance' => 'credit', 'is_system' => true]);
        
        $tenant->accounts()->create([
            'parent_id' => $assets->id,
            'code' => '1400',
            'name' => 'Inventory',
            'type' => \App\Models\Account::TYPE_ASSET,
            'normal_balance' => 'debit',
            'is_system' => true,
        ]);
    }
}
