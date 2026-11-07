<?php

namespace App\Services\Reporting;

use App\Models\Account;
use App\Models\Expense;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Support\Tenancy\TenantContext;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class DashboardReportService
{
    public const TITLES = ['sales' => 'Net sales', 'purchases' => 'Net purchases', 'expenses' => 'Expenses', 'cash' => 'Cash balance', 'receivables' => 'Receivable ledger', 'low-stock' => 'Low stock'];

    public function lowStock()
    {
        return ProductVariant::query()->where('is_active', true)->whereHas('product', fn ($query) => $query->where('is_active', true))
            ->withSum('stockBalances as stock_quantity', 'quantity')
            ->whereRaw('(SELECT COALESCE(SUM(quantity), 0) FROM stock_balances WHERE product_variant_id = product_variants.id AND tenant_id = product_variants.tenant_id) <= product_variants.reorder_level');
    }

    public function accountBalance(string $code, string $endDate, ?string $beforeDate = null): float
    {
        $id = Account::query()->where('code', $code)->value('id');

        return (float) DB::table('journal_lines as lines')->join('journal_entries as entries', 'entries.id', '=', 'lines.journal_entry_id')
            ->where('lines.tenant_id', app(TenantContext::class)->id())->where('entries.tenant_id', app(TenantContext::class)->id())
            ->where('lines.account_id', $id)->where('entries.entry_date', '<=', $endDate)
            ->when($beforeDate, fn ($query) => $query->where('entries.entry_date', '<', $beforeDate))
            ->selectRaw('COALESCE(SUM(lines.debit - lines.credit), 0) as balance')->value('balance');
    }

    public function overview(array $period): array
    {
        $end = CarbonImmutable::parse($period['end_date']);
        $chartStart = $end->subDays(6)->toDateString();
        $first = min($period['start_date'], $chartStart);
        $series = [];
        foreach ([['sales', Sale::class, 'sale_date', 'grand_total'], ['sale_returns', SaleReturn::class, 'return_date', 'total'],
            ['purchases', Purchase::class, 'purchase_date', 'grand_total'], ['purchase_returns', PurchaseReturn::class, 'return_date', 'total'],
            ['expenses', Expense::class, 'expense_date', 'amount']] as [$key, $model, $date, $amount]) {
            $series[$key] = $model::query()->when($model !== Expense::class, fn ($query) => $query->where('status', 'posted'))
                ->whereBetween($date, [$first, $period['end_date']])->selectRaw("{$date}, SUM({$amount}) as total")
                ->groupBy($date)->pluck('total', $date);
        }
        $sum = fn ($key) => (float) $series[$key]->filter(fn ($amount, $date) => $date >= $period['start_date'])->sum();
        $charts = ['sales' => [], 'purchases' => [], 'expenses' => []];
        for ($offset = 6; $offset >= 0; $offset--) {
            $day = $end->subDays($offset);
            $date = $day->toDateString();
            foreach (['sales' => 'sale_returns', 'purchases' => 'purchase_returns', 'expenses' => null] as $key => $returns) {
                $charts[$key][] = ['day' => $day->format('D'), 'date' => $date, 'total' => round((float) ($series[$key][$date] ?? 0) - ($returns ? (float) ($series[$returns][$date] ?? 0) : 0), 4)];
            }
        }

        return [
            'summary' => ['sales' => round($sum('sales') - $sum('sale_returns'), 4), 'purchases' => round($sum('purchases') - $sum('purchase_returns'), 4),
                'expenses' => round($sum('expenses'), 4), 'cash' => $this->accountBalance('1100', $period['end_date']),
                'receivables' => $this->accountBalance('1300', $period['end_date']), 'low-stock' => $this->lowStock()->count()],
            'charts' => $charts,
        ];
    }

    public function rows(string $metric, array $period)
    {
        $tenantId = app(TenantContext::class)->id();
        if ($metric === 'low-stock') {
            return $this->lowStock()->with('product:id,name')->orderBy('sku')->paginate(25)->withQueryString()
                ->through(fn ($row) => ['id' => $row->id, 'date' => null, 'number' => $row->sku, 'description' => $row->product->name.' · '.$row->name,
                    'amount' => (float) ($row->stock_quantity ?? 0), 'detail' => 'Reorder level: '.$row->reorder_level, 'href' => '/stock?product_variant_id='.$row->id]);
        }
        if (in_array($metric, ['cash', 'receivables'])) {
            $code = $metric === 'cash' ? '1100' : '1300';
            $accountId = Account::query()->where('code', $code)->value('id');

            return DB::table('journal_lines as lines')->join('journal_entries as entries', 'entries.id', '=', 'lines.journal_entry_id')
                ->where('lines.tenant_id', $tenantId)->where('entries.tenant_id', $tenantId)->where('lines.account_id', $accountId)
                ->whereBetween('entries.entry_date', [$period['start_date'], $period['end_date']])
                ->selectRaw('lines.id, entries.entry_date as date, entries.number as number, entries.description as description, (lines.debit - lines.credit) as amount, entries.reference_number as detail')
                ->orderByDesc('entries.entry_date')->orderByDesc('lines.id')->paginate(25)->withQueryString();
        }
        $tables = match ($metric) {
            'sales' => [['sales', 'sale_date', 'grand_total', 'customer_id', 'customers', 1, '/sales/'], ['sale_returns', 'return_date', 'total', 'customer_id', 'customers', -1, '/sales/returns/']],
            'purchases' => [['purchases', 'purchase_date', 'grand_total', 'supplier_id', 'suppliers', 1, '/purchases/'], ['purchase_returns', 'return_date', 'total', 'supplier_id', 'suppliers', -1, '/purchases/returns/']],
            'expenses' => [['expenses', 'expense_date', 'amount', null, null, 1, '/expenses']],
        };
        $queries = [];
        foreach ($tables as [$table, $date, $amount, $foreign, $party, $sign, $link]) {
            $query = DB::table($table.' as documents')->where('documents.tenant_id', $tenantId)
                ->whereBetween('documents.'.$date, [$period['start_date'], $period['end_date']]);
            if ($table !== 'expenses') {
                $query->where('documents.status', 'posted');
            }
            if ($party) {
                $query->leftJoin($party.' as parties', fn ($join) => $join->on('parties.id', '=', 'documents.'.$foreign)->where('parties.tenant_id', $tenantId));
            }
            $queries[] = $query->selectRaw("documents.id, documents.{$date} as date, documents.number, ".($party ? 'parties.name' : 'documents.notes')." as description, documents.{$amount} * ? as amount, ? as detail, ".($table === 'expenses' ? '? as href' : 'CONCAT(?, documents.id) as href'), [$sign, $sign < 0 ? 'Return credit' : ($table === 'expenses' ? 'Expense' : 'Posted invoice'), $link]);
        }
        $union = array_shift($queries);
        foreach ($queries as $query) {
            $union->unionAll($query);
        }

        return DB::query()->fromSub($union, 'events')->orderByDesc('date')->orderByDesc('id')->paginate(25)->withQueryString();
    }
}
