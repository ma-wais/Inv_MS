<?php

namespace Tests\Feature\Accounting;

use App\Models\Customer;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Inventory\StockMovementService;
use App\Services\Purchasing\PurchaseService;
use App\Services\Reporting\OperationalReportService;
use App\Services\Sales\SaleService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceReturnsTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private ProductVariant $variant;

    private Customer $customer;

    private array $saleData;

    protected function setUp(): void
    {
        parent::setUp();
        $this->post('/register', [
            'name' => 'Accounts Admin', 'email' => 'accounts@example.test', 'password' => 'password123',
            'password_confirmation' => 'password123', 'shop_name' => 'Accounts Shop',
            'shop_slug' => 'accounts-shop', 'currency' => 'PKR', 'timezone' => 'Asia/Karachi',
        ])->assertSessionHasNoErrors();
        $this->tenant = Tenant::where('slug', 'accounts-shop')->firstOrFail();
        app(TenantContext::class)->set($this->tenant);
        $this->actingAs(User::where('email', 'accounts@example.test')->firstOrFail())
            ->withSession(['tenant_id' => $this->tenant->id]);
        $product = Product::create([
            'name' => 'Paint', 'slug' => 'paint', 'base_unit_id' => $this->tenant->units()->where('symbol', 'pc')->first()->id,
        ]);
        $this->variant = $product->variants()->create([
            'tenant_id' => $this->tenant->id, 'name' => 'Can', 'sku' => 'PAINT', 'purchase_price' => 100, 'sale_price' => 150,
        ]);
        $warehouse = $this->tenant->warehouses()->first();
        app(StockMovementService::class)->record($warehouse, $this->variant, 'opening', 10, unitCost: 100);
        $this->customer = Customer::create(['name' => 'Customer', 'code' => 'CUSTOMER']);
        $this->saleData = [
            'customer_id' => $this->customer->id, 'warehouse_id' => $warehouse->id,
            'sale_date' => '2026-10-13', 'status' => 'posted', 'payment_amount' => 0,
        ];
    }

    private function sell(float $quantity = 2, float $price = 150, array $data = []): Sale
    {
        return app(SaleService::class)->checkout([...$this->saleData, ...$data], [
            ['product_variant_id' => $this->variant->id, 'quantity' => $quantity, 'unit_price' => $price],
        ]);
    }

    private function accountBalance(string $code): float
    {
        return round((float) JournalLine::query()->whereHas('account', fn ($q) => $q->where('code', $code))
            ->selectRaw('SUM(debit - credit) as balance')->value('balance'), 4);
    }

    public function test_discounted_return_preserves_original_cost_and_leaves_customer_credit(): void
    {
        $sale = $this->sell(data: ['discount_total' => 40, 'tax_total' => 10, 'shipping_total' => 10, 'payment_amount' => 280]);
        $item = $sale->items()->first();
        $this->assertSame('280.0000', $item->net_total);
        $this->assertSame('100.0000', $item->unit_cost);
        $this->variant->update(['purchase_price' => 200]);
        $before = app(OperationalReportService::class)->productProfit()->first();
        $this->assertSame(280.0, $before['revenue']);
        $this->assertSame(200.0, $before['cogs']);

        $this->post("/sales/{$sale->id}/returns", [
            'return_date' => '2026-10-14', 'items' => [['sale_item_id' => $item->id, 'quantity' => 1]],
        ])->assertSessionHasNoErrors();
        $sale->refresh();
        $this->assertSame(140.0, $sale->returned_total);
        $this->assertSame(0.0, $sale->outstanding);
        $this->assertSame(140.0, $sale->credit_balance);
        $this->assertEquals(-140, $this->customer->ledgerBalance());
        $this->assertSame('100.0000', $item->returnItems()->first()->unit_cost);
        $this->assertSame(100.0, $this->accountBalance('5100'));
        $this->assertSame(-140.0, $this->accountBalance('4100'));
        $this->assertSame(-140.0, $this->accountBalance('1300'));
        $this->assertSame('9.000000', $this->variant->stockBalances()->first()->quantity);
        $report = app(OperationalReportService::class)->productProfit()->first();
        $this->assertSame(140.0, $report['revenue']);
        $this->assertSame(100.0, $report['cogs']);
        $this->assertSame(40.0, $report['profit']);
        $this->assertFalse($report['cost_history_missing']);
        foreach (JournalEntry::with('lines')->get() as $journal) {
            $this->assertEqualsWithDelta($journal->lines->sum('debit'), $journal->lines->sum('credit'), 0.00001);
        }
    }

    public function test_return_period_report_includes_returns_on_their_own_date(): void
    {
        $sale = $this->sell();
        app(SaleService::class)->createReturn($sale, ['return_date' => '2026-11-01'], [
            ['sale_item_id' => $sale->items()->first()->id, 'quantity' => 1],
        ]);
        $october = app(OperationalReportService::class)->productProfit('2026-10-01', '2026-10-31')->first();
        $november = app(OperationalReportService::class)->productProfit('2026-11-01', '2026-11-30')->first();
        $this->assertSame(300.0, $october['revenue']);
        $this->assertSame(-1.0, $november['quantity_sold']);
        $this->assertSame(-150.0, $november['revenue']);
        $this->assertSame(-100.0, $november['cogs']);
        $this->assertSame(-50.0, $november['profit']);
    }

    public function test_repeated_partial_returns_allocate_rounding_once_and_cannot_over_return(): void
    {
        $sale = $this->sell(3, 1, ['discount_total' => 2]);
        $item = $sale->items()->first();
        $credits = [];
        for ($i = 0; $i < 3; $i++) {
            $return = app(SaleService::class)->createReturn($sale, ['return_date' => '2026-10-14'], [
                ['sale_item_id' => $item->id, 'quantity' => 1],
            ]);
            $credits[] = (float) $return->total;
        }
        $this->assertSame([0.3333, 0.3334, 0.3333], $credits);
        $this->assertSame(0.0, $sale->refresh()->outstanding);
        $this->assertEquals(0, $this->customer->ledgerBalance());
        $journalCount = JournalEntry::count();
        $this->post("/sales/{$sale->id}/returns", [
            'return_date' => '2026-10-14', 'items' => [['sale_item_id' => $item->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('items');
        $this->assertDatabaseCount('sale_returns', 3);
        $this->assertDatabaseCount('journal_entries', $journalCount);
        $this->assertSame('10.000000', $this->variant->stockBalances()->first()->quantity);
    }

    public function test_free_goods_still_post_cost_and_reverse_it_on_return(): void
    {
        $sale = $this->sell(1, 0);
        $this->assertSame(100.0, $this->accountBalance('5100'));
        $return = app(SaleService::class)->createReturn($sale, ['return_date' => '2026-10-14'], [
            ['sale_item_id' => $sale->items()->first()->id, 'quantity' => 1],
        ]);
        $this->assertSame('0.0000', $return->total);
        $this->assertSame(0.0, $this->accountBalance('5100'));
        $this->assertSame(0.0, $this->accountBalance('1400'));
        $this->assertDatabaseCount('journal_entries', 2);
    }

    public function test_purchase_return_credits_discounted_landed_cost_and_reduces_payable(): void
    {
        $supplier = Supplier::create(['name' => 'Supplier', 'code' => 'SUPPLIER']);
        $service = app(PurchaseService::class);
        $purchase = $service->create([
            'supplier_id' => $supplier->id, 'warehouse_id' => $this->saleData['warehouse_id'],
            'purchase_date' => '2026-10-13', 'status' => 'ordered', 'discount_total' => 20, 'shipping_total' => 10,
        ], [['product_variant_id' => $this->variant->id, 'quantity' => 2, 'unit_cost' => 100]]);
        $purchase = $service->receive($purchase);
        $item = $purchase->items()->first();
        $this->assertSame('190.0000', $item->net_total);
        $this->assertDatabaseHas('stock_movements', ['type' => 'purchase', 'reference_id' => $purchase->id, 'unit_cost' => 95]);
        $this->post("/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-10-14', 'items' => [['purchase_item_id' => $item->id, 'quantity' => 1]],
        ])->assertSessionHasNoErrors();
        $this->assertSame(95.0, $purchase->refresh()->outstanding);
        $this->assertSame(95.0, $purchase->returned_total);
        $this->assertEquals(95, $supplier->ledgerBalance());
        $this->assertSame(-95.0, $this->accountBalance('2100'));
        $this->assertSame(95.0, $this->accountBalance('1400'));
        $this->assertSame('11.000000', $this->variant->stockBalances()->first()->quantity);
        $this->post("/suppliers/{$supplier->id}/payments", [
            'purchase_id' => $purchase->id, 'payment_date' => '2026-10-14', 'amount' => 96, 'method' => 'cash',
        ])->assertSessionHasErrors('amount');
        $this->assertDatabaseCount('supplier_payments', 0);
    }

    public function test_duplicate_and_fractional_whole_unit_return_requests_do_not_mutate_stock(): void
    {
        $sale = $this->sell();
        $item = ['sale_item_id' => $sale->items()->first()->id, 'quantity' => 1];
        $this->post("/sales/{$sale->id}/returns", ['return_date' => '2026-10-14', 'items' => [$item, $item]])
            ->assertSessionHasErrors('items.0.sale_item_id');
        $this->post("/sales/{$sale->id}/returns", ['return_date' => '2026-10-14', 'items' => [[...$item, 'quantity' => 0.5]]])
            ->assertSessionHasErrors('items');
        $this->assertDatabaseCount('sale_returns', 0);
        $this->assertSame('8.000000', $this->variant->stockBalances()->first()->quantity);
    }

    public function test_missing_legacy_cost_is_flagged_and_return_does_not_guess_a_cost(): void
    {
        $sale = $this->sell();
        $item = $sale->items()->first();
        $item->update(['unit_cost' => null]);
        $this->assertTrue(app(OperationalReportService::class)->productProfit()->first()['cost_history_missing']);
        $this->post("/sales/{$sale->id}/returns", [
            'return_date' => '2026-10-14', 'items' => [['sale_item_id' => $item->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('items');
        $this->assertDatabaseCount('sale_returns', 0);
        $this->assertSame('8.000000', $this->variant->stockBalances()->first()->quantity);
    }
}
