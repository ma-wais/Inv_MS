<?php

namespace Tests\Feature\Accounting;

use App\Models\Account;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Services\Accounting\AccountingReportService;
use App\Services\Accounting\ExpenseService;
use App\Services\DocumentNumberService;
use App\Services\Inventory\StockMovementService;
use App\Services\Sales\SaleService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountingFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_sales_payments_and_expenses_post_correctly_to_ledger(): void
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

        // Seed basic parent accounts
        $assets = Account::create(['tenant_id' => $tenant->id, 'code' => '1000', 'name' => 'Assets', 'type' => Account::TYPE_ASSET, 'normal_balance' => 'debit', 'is_system' => true]);
        $liabilities = Account::create(['tenant_id' => $tenant->id, 'code' => '2000', 'name' => 'Liabilities', 'type' => Account::TYPE_LIABILITY, 'normal_balance' => 'credit', 'is_system' => true]);
        $income = Account::create(['tenant_id' => $tenant->id, 'code' => '4000', 'name' => 'Income', 'type' => Account::TYPE_INCOME, 'normal_balance' => 'credit', 'is_system' => true]);
        $expenses = Account::create(['tenant_id' => $tenant->id, 'code' => '5000', 'name' => 'Expenses', 'type' => Account::TYPE_EXPENSE, 'normal_balance' => 'debit', 'is_system' => true]);

        // Seed default child accounts
        $cashAcc = Account::create(['tenant_id' => $tenant->id, 'parent_id' => $assets->id, 'code' => '1100', 'name' => 'Cash on Hand', 'type' => Account::TYPE_ASSET, 'normal_balance' => 'debit', 'is_system' => true]);
        $bankAcc = Account::create(['tenant_id' => $tenant->id, 'parent_id' => $assets->id, 'code' => '1200', 'name' => 'Bank Account', 'type' => Account::TYPE_ASSET, 'normal_balance' => 'debit', 'is_system' => true]);
        $arAcc = Account::create(['tenant_id' => $tenant->id, 'parent_id' => $assets->id, 'code' => '1300', 'name' => 'Accounts Receivable', 'type' => Account::TYPE_ASSET, 'normal_balance' => 'debit', 'is_system' => true]);
        $inventoryAcc = Account::create(['tenant_id' => $tenant->id, 'parent_id' => $assets->id, 'code' => '1400', 'name' => 'Inventory', 'type' => Account::TYPE_ASSET, 'normal_balance' => 'debit', 'is_system' => true]);
        $apAcc = Account::create(['tenant_id' => $tenant->id, 'parent_id' => $liabilities->id, 'code' => '2100', 'name' => 'Accounts Payable', 'type' => Account::TYPE_LIABILITY, 'normal_balance' => 'credit', 'is_system' => true]);
        $revenueAcc = Account::create(['tenant_id' => $tenant->id, 'parent_id' => $income->id, 'code' => '4100', 'name' => 'Sales Revenue', 'type' => Account::TYPE_INCOME, 'normal_balance' => 'credit', 'is_system' => true]);
        $cogsAcc = Account::create(['tenant_id' => $tenant->id, 'parent_id' => $expenses->id, 'code' => '5100', 'name' => 'Cost of Goods Sold', 'type' => Account::TYPE_EXPENSE, 'normal_balance' => 'debit', 'is_system' => true]);
        $operatingExpensesAcc = Account::create(['tenant_id' => $tenant->id, 'parent_id' => $expenses->id, 'code' => '5200', 'name' => 'Operating Expenses', 'type' => Account::TYPE_EXPENSE, 'normal_balance' => 'debit', 'is_system' => true]);

        // Seed basic inventory dependencies
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
            'purchase_price' => 100, // purchase price is 100
            'sale_price' => 150,     // sale price is 150
            'reorder_level' => 5,
        ]);

        // Stock in some opening stock (20 units * 100 cost = 2000 total inventory value)
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
            'opening_balance' => 0,
        ]);

        $saleService = app(SaleService::class);

        // 1. Post a sale of 5 items:
        // Sales total = 5 * 150 = 750 (debit AR 750, credit Revenue 750)
        // COGS total = 5 * 100 = 500 (debit COGS 500, credit Inventory 500)
        $sale = $saleService->create([
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'sale_date' => '2026-06-18',
            'status' => 'posted',
        ], [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 5,
                'unit_price' => 150,
            ],
        ]);

        $reportService = new AccountingReportService;

        // Verify General Ledger entries for AR
        $arLedger = $reportService->generalLedger($arAcc);
        $this->assertCount(1, $arLedger);
        $this->assertSame(750.0, $arLedger->first()['balance']);
        $this->assertSame(750.0, $arLedger->first()['debit']);

        // Verify General Ledger entries for Revenue
        $revLedger = $reportService->generalLedger($revenueAcc);
        $this->assertCount(1, $revLedger);
        $this->assertSame(750.0, $revLedger->first()['balance']);
        $this->assertSame(750.0, $revLedger->first()['credit']);

        // Verify COGS postings
        $cogsLedger = $reportService->generalLedger($cogsAcc);
        $this->assertCount(1, $cogsLedger);
        $this->assertSame(500.0, $cogsLedger->first()['debit']);

        // 2. Record Customer Payment of 400 (debit Cash 400, credit AR 400)
        $payment = $saleService->recordPayment($customer, [
            'payment_date' => '2026-06-18',
            'amount' => 400,
            'method' => 'cash',
            'sale_id' => $sale->id,
        ]);

        // Verify AR balance reduced to 350
        $arLedgerAfterPayment = $reportService->generalLedger($arAcc);
        $this->assertCount(2, $arLedgerAfterPayment);
        $this->assertSame(350.0, $arLedgerAfterPayment->last()['balance']);
        $this->assertSame(400.0, $arLedgerAfterPayment->last()['credit']);

        // Verify Cash on Hand has a debit balance of 400
        $cashLedger = $reportService->generalLedger($cashAcc);
        $this->assertCount(1, $cashLedger);
        $this->assertSame(400.0, $cashLedger->first()['balance']);
        $this->assertSame(400.0, $cashLedger->first()['debit']);

        // 3. Record an Expense of 80 (debit Operating Expenses 80, credit Cash 80)
        $expenseService = app(ExpenseService::class);
        $expense = $expenseService->create([
            'expense_account_id' => $operatingExpensesAcc->id,
            'payment_account_id' => $cashAcc->id,
            'expense_date' => '2026-06-18',
            'amount' => 80,
            'reference' => 'CHK-12',
            'notes' => 'Office supplies',
        ]);

        // Verify Cash on Hand balance reduced to 320 (400 - 80)
        $cashLedgerAfterExpense = $reportService->generalLedger($cashAcc);
        $this->assertCount(2, $cashLedgerAfterExpense);
        $this->assertSame(320.0, $cashLedgerAfterExpense->last()['balance']);
        $this->assertSame(80.0, $cashLedgerAfterExpense->last()['credit']);

        // Verify Trial Balance is balanced
        $trialBalance = $reportService->trialBalance();
        $totalDebit = $trialBalance->sum('debit');
        $totalCredit = $trialBalance->sum('credit');
        $this->assertSame($totalDebit, $totalCredit);
        $this->assertSame(1250.0, $totalDebit); // cash(320) + ar(350) + inventory(-500 from opening? No, wait: inventory doesn't include opening stock in GL unless seeded via JRN entry. So inventory has a credit entry of 500, which is credit balance 500. So assets side: cash 320 + ar 350 = 670 debit. Liabilities side: none. Revenue: 750 credit. COGS: 500 debit. Expenses: 80 debit. Total debits: 320 + 350 + 500 + 80 = 1250? Wait, let's look at Inventory: it has a credit balance of 500. A credit balance in asset is listed as credit in trial balance. So total credits: revenue 750 + inventory credit 500 = 1250. Total debits: cash 320 + ar 350 + cogs 500 + expenses 80 = 1250. Perfect, 1250 == 1250!)

        // 4. Verify Profit and Loss Report
        $pl = $reportService->profitAndLoss();
        $this->assertSame(750.0, $pl['total_revenue']);
        $this->assertSame(580.0, $pl['total_expense']); // COGS (500) + Operating Exp (80) = 580
        $this->assertSame(170.0, $pl['net_profit']);    // 750 - 580 = 170
    }
}
