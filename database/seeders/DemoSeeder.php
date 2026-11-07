<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductBarcode;
use App\Models\StockMovement;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Services\Inventory\StockMovementService;
use App\Services\Tenancy\ShopProvisioningService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('Demo data is restricted to local/testing environments.');
        }
        // 1. Seed Super Admin
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@ventory.test'],
            [
                'name' => 'Ventory Super Admin',
                'password' => Hash::make('password'),
                'is_super_admin' => true,
            ],
        );

        // 2. Seed Store Owner
        $owner = User::firstOrCreate(
            ['email' => 'owner@ventory.test'],
            [
                'name' => 'Demo Shop Owner',
                'password' => Hash::make('password'),
                'is_super_admin' => false,
            ],
        );

        $tenant = Tenant::firstOrCreate(
            ['slug' => 'demo-paint-store'],
            [
                'name' => 'Demo Paint Store',
                'phone' => '+92 300 0000000',
                'currency' => 'PKR',
                'timezone' => 'Asia/Karachi',
            ],
        );

        $tenant->users()->syncWithoutDetaching([
            $owner->id => ['role' => 'admin', 'is_default' => true],
            $superAdmin->id => ['role' => 'admin', 'is_default' => true],
        ]);

        $branch = $tenant->branches()->firstOrCreate(
            ['code' => 'MAIN'],
            ['name' => 'Main Branch', 'is_default' => true],
        );

        $branch->warehouses()->firstOrCreate(
            ['code' => 'MAIN-WH'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Main Warehouse',
                'is_default' => true,
            ],
        );

        $permissions = collect([
            ['View dashboard', 'dashboard.view', 'dashboard'],
            ['Manage users', 'users.manage', 'administration'],
            ['Manage shops', 'shops.manage', 'administration'],
            ['Manage products', 'products.manage', 'inventory'],
            ['Manage stock', 'stock.manage', 'inventory'],
            ['Manage purchases', 'purchases.manage', 'purchasing'],
            ['Manage sales', 'sales.manage', 'sales'],
            ['Manage accounting', 'accounting.manage', 'accounting'],
            ['View reports', 'reports.view', 'reports'],
        ])->map(fn (array $permission) => Permission::firstOrCreate(
            ['slug' => $permission[1]],
            ['name' => $permission[0], 'group' => $permission[2]],
        ));

        app(ShopProvisioningService::class)->provision($tenant);

        $tenantContext = new TenantContext;
        $tenantContext->set($tenant);

        $paintCategory = Category::firstOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => 'paint'],
            ['name' => 'Paint'],
        );
        $demoBrand = Brand::firstOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => 'demo-colors'],
            ['name' => 'Demo Colors'],
        );
        $liter = Unit::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('symbol', 'L')
            ->firstOrFail();

        $product = Product::firstOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => 'premium-emulsion'],
            [
                'category_id' => $paintCategory->id,
                'brand_id' => $demoBrand->id,
                'base_unit_id' => $liter->id,
                'name' => 'Premium Emulsion',
                'product_type' => 'paint',
                'description' => 'Demo paint product used to verify the inventory foundation.',
            ],
        );
        $variant = $product->variants()->firstOrCreate(
            ['sku' => 'PAINT-WHITE-4L'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'White - 4 Liter',
                'purchase_price' => 3200,
                'sale_price' => 3900,
                'reorder_level' => 5,
                'attributes' => ['shade' => 'White', 'size' => '4L'],
            ],
        );
        ProductBarcode::firstOrCreate(
            ['tenant_id' => $tenant->id, 'barcode' => '100000000001'],
            ['product_variant_id' => $variant->id, 'is_primary' => true],
        );

        if (! StockMovement::withoutGlobalScopes()->where('product_variant_id', $variant->id)->exists()) {
            (new StockMovementService($tenantContext))->record(
                $branch->warehouses()->where('code', 'MAIN-WH')->firstOrFail(),
                $variant,
                StockMovement::TYPE_OPENING,
                12,
                unitCost: $variant->purchase_price,
                reference: $product,
                referenceNumber: $variant->sku,
                note: 'Demo opening stock.',
            );
        }

    }
}
