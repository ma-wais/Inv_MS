<?php

namespace Tests\Feature\Purchasing;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\DocumentNumberService;
use App\Services\Inventory\StockMovementService;
use App\Services\Purchasing\PurchaseService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PurchaseFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_purchase_receive_payment_and_return_adjust_stock_and_balances(): void
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

        $branch = $tenant->branches()->create(['name' => 'Main', 'code' => 'MAIN', 'is_default' => true]);
        $warehouse = $branch->warehouses()->create(['tenant_id' => $tenant->id, 'name' => 'Main Warehouse', 'code' => 'MAIN-WH', 'is_default' => true]);
        $unit = Unit::create(['tenant_id' => $tenant->id, 'name' => 'Piece', 'symbol' => 'pc', 'allows_decimal' => false]);
        $category = Category::create(['name' => 'Paint', 'slug' => 'paint']);
        $brand = Brand::create(['name' => 'Demo Colors', 'slug' => 'demo-colors']);

        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'base_unit_id' => $unit->id,
            'name' => 'Red Paint',
            'slug' => 'red-paint',
            'product_type' => 'paint',
        ]);
        $variant = $product->variants()->create([
            'tenant_id' => $tenant->id,
            'name' => '5L',
            'sku' => 'RED-5L',
            'purchase_price' => 100,
            'sale_price' => 150,
            'reorder_level' => 5,
        ]);
        Supplier::create([
            'name' => 'Supply Co',
            'code' => 'SUP1',
            'opening_balance' => 25,
        ]);
        $supplier = Supplier::query()->firstOrFail();

        $postingMock = $this->createMock(\App\Services\Accounting\AutomaticPostingService::class);

        $service = new PurchaseService(
            $context,
            new DocumentNumberService($context),
            new StockMovementService($context),
            $postingMock,
        );

        $purchase = $service->create([
            'supplier_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
            'purchase_date' => '2026-06-11',
            'status' => Purchase::STATUS_ORDERED,
            'discount_total' => 0,
            'tax_total' => 0,
            'shipping_total' => 0,
        ], [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 10,
                'unit_cost' => 100,
            ],
        ]);

        $postedPurchase = $service->receive($purchase);

        $this->assertSame('posted', $postedPurchase->status);
        $this->assertSame('10.000000', $postedPurchase->items->first()->received_quantity);
        $this->assertSame('10.000000', $variant->stockBalances()->withoutGlobalScopes()->first()->quantity);

        $payment = $service->recordPayment($supplier, [
            'payment_date' => '2026-06-11',
            'amount' => 250,
            'method' => 'cash',
        ]);

        $this->assertSame('250.0000', $payment->amount);
        $this->assertSame(775.0, $supplier->fresh()->ledgerBalance());

        $return = $service->createReturn($postedPurchase->fresh(['items.variant']), [
            'return_date' => '2026-06-11',
        ], [
            [
                'purchase_item_id' => $postedPurchase->items->first()->id,
                'quantity' => 3,
            ],
        ]);

        $this->assertSame('3.000000', $return->items->first()->quantity);
        $this->assertSame('7.000000', $variant->stockBalances()->withoutGlobalScopes()->first()->quantity);
        $this->assertSame(475.0, $supplier->fresh()->ledgerBalance());
    }
}
