<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Expense;
use App\Services\Accounting\ExpenseService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class ExpenseController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Accounting/Expenses/Index', [
            'expenses' => Expense::query()
                ->with(['expenseAccount:id,code,name', 'paymentAccount:id,code,name', 'creator:id,name'])
                ->latest('expense_date')
                ->get(),
            'expenseAccounts' => Account::query()
                ->where('type', Account::TYPE_EXPENSE)
                ->where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name']),
            'paymentAccounts' => Account::query()
                ->where('type', Account::TYPE_ASSET)
                ->where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name']),
        ]);
    }

    public function store(Request $request, ExpenseService $service, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'expense_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'payment_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'expense_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $expense = $service->create($validated);
            $audit->record('expense.created', $expense, null, $expense->toArray());

        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['amount' => $exception->getMessage()]);
        }

        return back()->with('status', 'Expense recorded and journal posting created.');
    }
}
