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

    public function trialBalance(): Response
    {
        return Inertia::render('Accounting/Reports/TrialBalance', [
            'trialBalance' => $this->reports->trialBalance(),
        ]);
    }

    public function profitAndLoss(): Response
    {
        return Inertia::render('Accounting/Reports/ProfitLoss', [
            'profitAndLoss' => $this->reports->profitAndLoss(),
        ]);
    }

    public function generalLedger(Request $request): Response
    {
        $accounts = Account::query()->orderBy('code')->get(['id', 'code', 'name']);
        
        $selectedAccountId = $request->query('account_id') ?? $accounts->first()?->id;
        $selectedAccount = $selectedAccountId ? Account::findOrFail($selectedAccountId) : null;

        $ledgerEntries = $selectedAccount 
            ? $this->reports->generalLedger($selectedAccount) 
            : collect();

        return Inertia::render('Accounting/Reports/GeneralLedger', [
            'accounts' => $accounts,
            'selectedAccountId' => $selectedAccountId ? (int) $selectedAccountId : null,
            'ledger' => $ledgerEntries,
        ]);
    }
}
