<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Services\Accounting\AccountingReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountingReportController extends Controller
{
    public function __construct(
        private readonly AccountingReportService $reports,
    ) {}

    public function trialBalance(Request $request): Response
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());

        return Inertia::render('Accounting/Reports/TrialBalance', [
            'trialBalance' => $this->reports->trialBalance($startDate, $endDate),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    public function profitAndLoss(Request $request): Response
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());

        return Inertia::render('Accounting/Reports/ProfitLoss', [
            'profitAndLoss' => $this->reports->profitAndLoss($startDate, $endDate),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    public function generalLedger(Request $request): Response
    {
        $accounts = Account::query()->orderBy('code')->get(['id', 'code', 'name']);
        
        $selectedAccountId = $request->query('account_id') ?? $accounts->first()?->id;
        $selectedAccount = $selectedAccountId ? Account::findOrFail($selectedAccountId) : null;

        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());

        $ledgerEntries = $selectedAccount 
            ? $this->reports->generalLedger($selectedAccount, $startDate, $endDate) 
            : collect();

        return Inertia::render('Accounting/Reports/GeneralLedger', [
            'accounts' => $accounts,
            'selectedAccountId' => $selectedAccountId ? (int) $selectedAccountId : null,
            'ledger' => $ledgerEntries,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }
}
