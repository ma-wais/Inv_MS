<?php

namespace Tests\Feature\Sales;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Inventory\StockMovementService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private array $checkout;

    private $variant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->post('/register', [
            'name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password123',
            'password_confirmation' => 'password123', 'shop_name' => 'Checkout Shop',
            'shop_slug' => 'checkout', 'currency' => 'PKR', 'timezone' => 'Asia/Karachi',
        ])->assertSessionHasNoErrors();
        $tenant = Tenant::where('slug', 'checkout')->firstOrFail();
        app(TenantContext::class)->set($tenant);
        $this->actingAs(User::where('email', 'admin@example.test')->firstOrFail())->withSession(['tenant_id' => $tenant->id]);
        $product = Product::create([
            'name' => 'Paint', 'slug' => 'paint', 'base_unit_id' => $tenant->units()->first()->id,
        ]);
        $this->variant = $product->variants()->create([
            'tenant_id' => $tenant->id, 'name' => 'Can', 'sku' => 'PAINT', 'purchase_price' => 50, 'sale_price' => 100,
        ]);
        $warehouse = $tenant->warehouses()->first();
        app(StockMovementService::class)->record($warehouse, $this->variant, 'opening', 10, unitCost: 50);
        $customer = Customer::create(['name' => 'Customer', 'code' => 'CUSTOMER']);
        $this->checkout = [
            'customer_id' => $customer->id, 'warehouse_id' => $warehouse->id, 'sale_date' => '2026-10-13',
            'status' => 'posted', 'items' => [['product_variant_id' => $this->variant->id, 'quantity' => 1, 'unit_price' => 100]],
            'payment_amount' => 100, 'payment_method' => 'cash',
        ];
    }

    public function test_overpayment_rolls_back_invoice_stock_payment_and_journal(): void
    {
        $this->post('/sales', [...$this->checkout, 'payment_amount' => 150])->assertSessionHasErrors('checkout');
        $this->assertDatabaseCount('sales', 0);
        $this->assertDatabaseCount('customer_payments', 0);
        $this->assertDatabaseCount('journal_entries', 0);
        $this->assertSame('10.000000', $this->variant->stockBalances()->first()->quantity);
    }

    public function test_split_payment_posts_one_invoice_and_two_balanced_payments(): void
    {
        $this->post('/sales', [...$this->checkout, 'payments' => [
            ['method' => 'cash', 'amount' => 40], ['method' => 'bank', 'amount' => 60],
        ]])->assertSessionHasNoErrors();
        $this->assertDatabaseCount('sales', 1);
        $this->assertDatabaseCount('customer_payments', 2);
        $this->assertDatabaseHas('sales', ['paid_total' => 100, 'grand_total' => 100]);
        $this->assertSame('9.000000', $this->variant->stockBalances()->first()->quantity);
        $this->assertDatabaseCount('journal_entries', 4);
    }

    public function test_insufficient_stock_returns_a_form_error_without_saving_an_invoice(): void
    {
        $fields = $this->checkout;
        $fields['items'][0]['quantity'] = 11;
        $this->post('/sales', $fields)->assertSessionHasErrors('checkout');
        $this->assertDatabaseCount('sales', 0);
        $this->assertSame('10.000000', $this->variant->stockBalances()->first()->quantity);
    }

    public function test_credit_limit_and_walk_in_credit_are_enforced(): void
    {
        Customer::findOrFail($this->checkout['customer_id'])->update(['credit_limit' => 50]);
        $this->post('/sales', [...$this->checkout, 'payment_amount' => 0])->assertSessionHasErrors('checkout');
        Customer::findOrFail($this->checkout['customer_id'])->update(['credit_limit' => 0, 'code' => 'WALKIN']);
        $this->post('/sales', [...$this->checkout, 'payment_amount' => 0])->assertSessionHasErrors('checkout');
        $this->assertDatabaseCount('sales', 0);
    }

    public function test_catalog_only_returns_current_tenant_products(): void
    {
        $other = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        $otherProduct = Product::withoutGlobalScopes()->create([
            'tenant_id' => $other->id, 'name' => 'Private', 'slug' => 'private', 'base_unit_id' => $this->variant->product->base_unit_id,
        ]);
        $otherProduct->variants()->create(['tenant_id' => $other->id, 'name' => 'Private', 'sku' => 'PRIVATE', 'purchase_price' => 0, 'sale_price' => 0]);
        $this->get('/pos/catalog?search=PRIVATE')->assertOk()->assertJsonCount(0, 'variants');
        $this->get('/pos/catalog?search=PAINT')->assertOk()->assertJsonPath('variants.0.sku', 'PAINT');
    }
}
