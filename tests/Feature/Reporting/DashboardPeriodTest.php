<?php

namespace Tests\Feature\Reporting;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Inventory\StockMovementService;
use App\Services\Sales\SaleService;
use App\Support\Tenancy\TenantContext;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardPeriodTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-13 02:00:00', 'UTC'));
        $this->post('/register', ['name' => 'Daily Admin', 'email' => 'daily@example.test', 'password' => 'password123',
            'password_confirmation' => 'password123', 'shop_name' => 'Daily Shop', 'shop_slug' => 'daily', 'currency' => 'PKR', 'timezone' => 'Asia/Karachi']);
        $this->tenant = Tenant::where('slug', 'daily')->firstOrFail();
        app(TenantContext::class)->set($this->tenant);
        $this->admin = User::where('email', 'daily@example.test')->firstOrFail();
        $this->actingAs($this->admin)->withSession(['tenant_id' => $this->tenant->id]);
        $product = Product::create(['name' => 'Paint', 'slug' => 'paint', 'base_unit_id' => $this->tenant->units()->where('symbol', 'pc')->value('id')]);
        $variant = $product->variants()->create(['tenant_id' => $this->tenant->id, 'name' => 'Can', 'sku' => 'CAN', 'purchase_price' => 100, 'sale_price' => 150, 'reorder_level' => 9]);
        $warehouse = $this->tenant->warehouses()->first();
        app(StockMovementService::class)->record($warehouse, $variant, 'opening', 10, unitCost: 100);
        $customer = Customer::create(['name' => 'Customer', 'code' => 'CUST']);
        $service = app(SaleService::class);
        $data = ['customer_id' => $customer->id, 'warehouse_id' => $warehouse->id, 'status' => 'posted', 'payment_method' => 'cash'];
        $old = $service->checkout([...$data, 'sale_date' => '2026-10-12', 'payment_amount' => 150], [['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_price' => 150]]);
        $service->checkout([...$data, 'sale_date' => '2026-10-13', 'payment_amount' => 100], [['product_variant_id' => $variant->id, 'quantity' => 2, 'unit_price' => 150]]);
        $service->createReturn($old, ['return_date' => '2026-10-13'], [['sale_item_id' => $old->items()->first()->id, 'quantity' => 1]]);
    }

    public function test_today_default_and_custom_range_agree_with_itemized_return_aware_activity(): void
    {
        $this->get('/dashboard')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Dashboard')
            ->where('filters.period', 'today')->where('filters.start_date', '2026-10-13')->where('filters.end_date', '2026-10-13')
            ->where('summary.sales', 150)->where('summary.cash', 250)->where('summary.receivables', 50)->where('summary.low-stock', 1));
        $this->get('/dashboard?period=month')->assertOk()->assertInertia(fn (Assert $page) => $page->where('filters.start_date', '2026-10-01')->where('summary.sales', 300));
        $this->get('/dashboard/metrics/sales?period=today')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Reporting/DashboardMetric')
            ->has('rows.data', 2)->where('rows.total', 2)->where('rows.data', fn ($rows) => abs(collect($rows)->sum('amount') - 150) < 0.00001));
        $this->get('/dashboard/metrics/cash?period=today')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('opening_balance', 150)->where('closing_balance', 250)->has('rows.data', 1));
    }

    public function test_timezone_invalid_ranges_and_worker_financial_drill_down_are_enforced(): void
    {
        $this->travelTo(Carbon::parse('2026-10-12 20:30:00', 'UTC'));
        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('filters.start_date', '2026-10-13'));
        $this->get('/dashboard?period=custom&start_date=2026-10-14&end_date=2026-10-13')->assertSessionHasErrors('end_date');
        $this->get('/dashboard?period=custom&start_date=2024-01-01&end_date=2026-10-13')->assertSessionHasErrors('end_date');
        $this->tenant->users()->updateExistingPivot($this->admin->id, ['role' => 'worker']);
        $this->get('/dashboard')->assertOk()->assertInertia(fn (Assert $page) => $page->missing('summary.cash')->missing('summary.expenses'));
        $this->get('/dashboard/metrics/sales')->assertOk();
        $this->get('/dashboard/metrics/cash')->assertForbidden();
        $this->get('/dashboard/metrics/unknown')->assertNotFound();
    }
}
