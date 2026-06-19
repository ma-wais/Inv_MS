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
        return Inertia::render('Accounting/Accounts/Index', [
            'accounts' => Account::query()
                ->with('parent')
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

        return back()->with('status', 'Account created.');
    }
}
