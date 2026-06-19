<?php

namespace Tests\Feature\Sales;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Services\DocumentNumberService;
use App\Services\Inventory\StockMovementService;
use App\Services\Sales\SaleService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SaleFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_post_payment_and_return_adjust_stock_and_balances(): void
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

        // Stock in some opening balance first so we don't sell negative
        $stockService = new StockMovementService($context);
        $stockService->record(
            $warehouse,
            $variant,
            'opening',
            20,
            unitCost: 100,
            note: 'Opening stock'
        );

        $customer = Customer::create([
            'name' => 'Walk-in Customer',
            'code' => 'CUS1',
            'opening_balance' => 10,
        ]);

        $postingMock = $this->createMock(\App\Services\Accounting\AutomaticPostingService::class);
        $service = new SaleService(
            $context,
            new DocumentNumberService($context),
            $stockService,
            $postingMock,
        );

        // 1. Create a sale of 5 items
        $sale = $service->create([
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'sale_date' => '2026-06-18',
            'status' => 'posted',
            'discount_total' => 0,
            'tax_total' => 0,
            'shipping_total' => 0,
        ], [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 5,
                'unit_price' => 150,
            ],
        ]);

        // Sale posted immediately, verify stock reduced from 20 to 15
        $this->assertSame('posted', $sale->status);
        $this->assertSame('15.000000', $variant->stockBalances()->withoutGlobalScopes()->first()->quantity);

        // Verify customer ledger balance: Opening balance (10) + Sale (5 * 150 = 750) = 760
        $this->assertSame(760.0, $customer->fresh()->ledgerBalance());

        // 2. Record payment of 300
        $payment = $service->recordPayment($customer, [
            'payment_date' => '2026-06-18',
            'amount' => 300,
            'method' => 'cash',
            'sale_id' => $sale->id,
        ]);

        // Verify payment recorded
        $this->assertSame('300.0000', $payment->amount);
        $this->assertSame(460.0, $customer->fresh()->ledgerBalance());
        $this->assertSame(300.0, (float) $sale->fresh()->paid_total);

        // 3. Perform a sale return of 2 items
        $return = $service->createReturn($sale->fresh(), [
            'return_date' => '2026-06-18',
        ], [
            [
                'sale_item_id' => $sale->items->first()->id,
                'quantity' => 2,
            ],
        ]);

        // Return posted, verify stock goes back from 15 to 17
        $this->assertSame('2.000000', $return->items->first()->quantity);
        $this->assertSame('17.000000', $variant->stockBalances()->withoutGlobalScopes()->first()->quantity);

        // Verify customer ledger balance: 460 - (2 * 150 = 300) = 160
        $this->assertSame(160.0, $customer->fresh()->ledgerBalance());
    }
}
