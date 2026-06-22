<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Branch;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Support\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(TenantContext $tenantContext): Response
    {
        $tenant = $tenantContext->get();

        // 1. Today's Sales & Purchases
        $todayDate = now()->toDateString();
        $todaySales = (float) Sale::query()
            ->where('status', 'posted')
            ->whereDate('sale_date', $todayDate)
            ->sum('grand_total');

        $todayPurchases = (float) Purchase::query()
            ->whereIn('status', ['received', 'posted'])
            ->whereDate('purchase_date', $todayDate)
            ->sum('grand_total');

        // 2. Cash on Hand (Account 1100) & Accounts Receivable (Account 1300) Balances
        $cashAccount = Account::where('code', '1100')->first();
        $cashBalance = 0.0;
        if ($cashAccount) {
            $cashBalance = (float) DB::table('journal_lines')
                ->where('account_id', $cashAccount->id)
                ->selectRaw('SUM(debit) - SUM(credit) as balance')
                ->first()
                ->balance ?? 0.0;
        }

        $arAccount = Account::where('code', '1300')->first();
        $arBalance = 0.0;
        if ($arAccount) {
            $arBalance = (float) DB::table('journal_lines')
                ->where('account_id', $arAccount->id)
                ->selectRaw('SUM(debit) - SUM(credit) as balance')
                ->first()
                ->balance ?? 0.0;
        }

        // 3. Low Stock Count (variants where stock < reorder_level)
        $lowStockCount = DB::table('product_variants as pv')
            ->join('products as p', 'p.id', '=', 'pv.product_id')
            ->where('p.tenant_id', $tenant->id)
            ->where('pv.is_active', true)
            ->leftJoin('stock_balances as sb', 'sb.product_variant_id', '=', 'pv.id')
            ->selectRaw('pv.id, pv.reorder_level, COALESCE(SUM(sb.quantity), 0) as stock')
            ->groupBy('pv.id', 'pv.reorder_level')
            ->get()
            ->filter(fn ($row) => $row->stock < $row->reorder_level)
            ->count();

        // 4. Last 7 Days Sales Chart Data
        // 4. Last 7 Days Charts Data
        $salesHistory = [];
        $purchasesHistory = [];
        $expensesHistory = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $label = now()->subDays($i)->format('D');
            
            $salesHistory[] = [
                'day' => $label,
                'total' => (float) Sale::query()
                    ->where('status', 'posted')
                    ->whereDate('sale_date', $date)
                    ->sum('grand_total'),
            ];

            $purchasesHistory[] = [
                'day' => $label,
                'total' => (float) Purchase::query()
                    ->whereIn('status', ['received', 'posted'])
                    ->whereDate('purchase_date', $date)
                    ->sum('grand_total'),
            ];

            $expensesHistory[] = [
                'day' => $label,
                'total' => (float) \App\Models\Expense::query()
                    ->whereDate('expense_date', $date)
                    ->sum('amount'),
            ];
        }

        return Inertia::render('Dashboard', [
            'summary' => [
                'branches' => Branch::query()->where('is_active', true)->count(),
                'warehouses' => Warehouse::query()->where('is_active', true)->count(),
                'accounts' => Account::query()->where('is_active', true)->count(),
                'users' => $tenant->users()->count(),
                'today_sales' => $todaySales,
                'today_purchases' => $todayPurchases,
                'cash_balance' => $cashBalance,
                'ar_balance' => $arBalance,
                'low_stock_count' => $lowStockCount,
            ],
            'branches' => Branch::query()
                ->where('is_active', true)
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'is_default']),
            'sales_history' => $salesHistory,
            'purchases_history' => $purchasesHistory,
            'expenses_history' => $expensesHistory,
        ]);
    }
}
