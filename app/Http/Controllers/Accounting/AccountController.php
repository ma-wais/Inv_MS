<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(): Response
    {
        $accounts = Account::query()
            ->with('parent')
            ->orderBy('code')
            ->get()
            ->map(function (Account $account) {
                $sums = \Illuminate\Support\Facades\DB::table('journal_lines')
                    ->where('account_id', $account->id)
                    ->selectRaw('COALESCE(SUM(debit), 0) as total_debit, COALESCE(SUM(credit), 0) as total_credit')
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

                $account->debit_balance = $displayDebit;
                $account->credit_balance = $displayCredit;
                return $account;
            });

        return Inertia::render('Accounting/Accounts/Index', [
            'accounts' => $accounts,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Accounting/Accounts/Create', [
            'accounts' => Account::query()
                ->orderBy('code')
                ->get(),
        ]);
    }

    public function store(Request $request, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'parent_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:asset,liability,equity,income,expense'],
            'normal_balance' => ['required', 'string', 'in:debit,credit'],
            'description' => ['nullable', 'string'],
        ]);

        // Ensure code is unique for this tenant
        $exists = Account::query()
            ->where('code', $validated['code'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['code' => 'This account code is already in use.']);
        }

        $account = Account::create([
            ...$validated,
            'is_system' => false,
            'is_active' => true,
        ]);

        $audit->record('account.created', $account, null, $account->toArray());

        return redirect()->route('accounts.index')->with('status', 'Account created.');
    }
}
