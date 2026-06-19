<?php

namespace App\Services\Accounting;

use App\Models\Account;
use App\Models\Expense;
use App\Services\DocumentNumberService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ExpenseService
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly DocumentNumberService $documentNumbers,
        private readonly JournalEntryService $journalEntries,
    ) {}

    public function create(array $data): Expense
    {
        $amount = (float) $data['amount'];

        if ($amount <= 0) {
            throw new InvalidArgumentException('Expense amount must be greater than zero.');
        }

        return DB::transaction(function () use ($data, $amount): Expense {
            $expenseAccount = Account::query()->findOrFail($data['expense_account_id']);
            $paymentAccount = Account::query()->findOrFail($data['payment_account_id']);

            if ($expenseAccount->type !== Account::TYPE_EXPENSE) {
                throw new InvalidArgumentException('The selected category is not an expense account.');
            }

            if ($paymentAccount->type !== Account::TYPE_ASSET) {
                throw new InvalidArgumentException('The payment account must be an asset (e.g., Cash or Bank).');
            }

            $expense = Expense::create([
                'tenant_id' => $this->tenantContext->id(),
                'created_by' => auth()->id(),
                'expense_account_id' => $expenseAccount->id,
                'payment_account_id' => $paymentAccount->id,
                'number' => $this->documentNumbers->next(Expense::class, 'EXP'),
                'expense_date' => $data['expense_date'],
                'amount' => $amount,
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            // Post double entry: Debit Expense, Credit Cash/Bank Asset
            $this->journalEntries->create([
                'entry_date' => $expense->expense_date->toDateString(),
                'reference_type' => Expense::class,
                'reference_id' => $expense->id,
                'reference_number' => $expense->number,
                'description' => "System posting for expense: {$expense->notes}",
                'is_system' => true,
            ], [
                [
                    'account_id' => $expenseAccount->id,
                    'debit' => $amount,
                    'credit' => 0.0,
                    'description' => 'Expense debit',
                ],
                [
                    'account_id' => $paymentAccount->id,
                    'debit' => 0.0,
                    'credit' => $amount,
                    'description' => 'Payment credit',
                ],
            ]);

            return $expense;
        });
    }
}
