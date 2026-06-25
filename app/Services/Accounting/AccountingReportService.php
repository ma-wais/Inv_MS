<?php

namespace App\Services\Accounting;

use App\Models\Account;
use App\Models\JournalLine;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AccountingReportService
{
    public function trialBalance(?string $startDate = null, ?string $endDate = null): Collection
    {
        return Account::query()
            ->get()
            ->map(function (Account $account) use ($startDate, $endDate) {
                $query = DB::table('journal_lines')
                    ->join('journal_entries', 'journal_lines.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_lines.account_id', $account->id);

                if ($startDate) {
                    $query->where('journal_entries.entry_date', '>=', $startDate);
                }
                if ($endDate) {
                    $query->where('journal_entries.entry_date', '<=', $endDate);
                }

                $sums = $query->selectRaw('COALESCE(SUM(journal_lines.debit), 0) as total_debit, COALESCE(SUM(journal_lines.credit), 0) as total_credit')
                    ->first();

                $debit = (float) $sums->total_debit;
                $credit = (float) $sums->total_credit;
                $balance = 0.0;
                $displayDebit = 0.0;
                $displayCredit = 0.0;

                if ($account->normal_balance === 'debit') {
                    $balance = $debit - $credit;
                    if ($balance >= 0) {
                        $displayDebit = $balance;
                    } else {
                        $displayCredit = abs($balance);
                    }
                } else {
                    $balance = $credit - $debit;
                    if ($balance >= 0) {
                        $displayCredit = $balance;
                    } else {
                        $displayDebit = abs($balance);
                    }
                }

                return [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'type' => $account->type,
                    'debit' => $displayDebit,
                    'credit' => $displayCredit,
                ];
            })
            ->filter(fn (array $row) => $row['debit'] > 0 || $row['credit'] > 0)
            ->values();
    }

    public function profitAndLoss(?string $startDate = null, ?string $endDate = null): array
    {
        $trialBalance = $this->trialBalance($startDate, $endDate);

        $revenueItems = $trialBalance->filter(fn ($row) => $row['type'] === Account::TYPE_INCOME);
        $expenseItems = $trialBalance->filter(fn ($row) => $row['type'] === Account::TYPE_EXPENSE);

        $totalRevenue = $revenueItems->sum('credit') - $revenueItems->sum('debit');
        $totalExpense = $expenseItems->sum('debit') - $expenseItems->sum('credit');
        $netProfit = $totalRevenue - $totalExpense;

        return [
            'revenue_items' => $revenueItems->values()->toArray(),
            'expense_items' => $expenseItems->values()->toArray(),
            'total_revenue' => round($totalRevenue, 4),
            'total_expense' => round($totalExpense, 4),
            'net_profit' => round($netProfit, 4),
        ];
    }

    public function generalLedger(Account $account, ?string $startDate = null, ?string $endDate = null): Collection
    {
        $linesQuery = JournalLine::query()
            ->with('entry')
            ->where('account_id', $account->id);

        if ($startDate) {
            $linesQuery->whereHas('entry', fn($q) => $q->where('entry_date', '>=', $startDate));
        }
        if ($endDate) {
            $linesQuery->whereHas('entry', fn($q) => $q->where('entry_date', '<=', $endDate));
        }

        $lines = $linesQuery->get()
            ->sortBy(fn (JournalLine $line) => ($line->entry->entry_date->toDateString() ?? '0000-00-00').'|'.$line->entry->number)
            ->values();

        $balance = 0.0;

        return $lines->map(function (JournalLine $line) use (&$balance, $account) {
            $debit = (float) $line->debit;
            $credit = (float) $line->credit;

            if ($account->normal_balance === 'debit') {
                $balance += $debit - $credit;
            } else {
                $balance += $credit - $debit;
            }

            return [
                'date' => $line->entry->entry_date->toDateString(),
                'entry_number' => $line->entry->number,
                'description' => $line->description ?? $line->entry->description,
                'reference_number' => $line->entry->reference_number,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => round($balance, 4),
            ];
        });
    }
}
