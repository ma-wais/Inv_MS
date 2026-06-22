import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React from 'react';
import FloatingInput from '../../../Components/FloatingInput';
import SearchableSelect from '../../../Components/SearchableSelect';

export default function Index({ expenses, expenseAccounts, paymentAccounts }) {
    const { flash } = usePage().props;
    
    const form = useForm({
        expense_account_id: expenseAccounts[0]?.id ?? '',
        payment_account_id: paymentAccounts[0]?.id ?? '',
        expense_date: new Date().toISOString().slice(0, 10),
        amount: '',
        reference: '',
        notes: '',
    });

    function submit(event) {
        event.preventDefault();
        form.post('/expenses', { 
            preserveScroll: true, 
            onSuccess: () => form.reset('amount', 'reference', 'notes') 
        });
    }

    const expenseAccountOptions = expenseAccounts.map(acc => ({
        value: acc.id,
        label: `${acc.code} - ${acc.name}`
    }));

    const paymentAccountOptions = paymentAccounts.map(acc => ({
        value: acc.id,
        label: `${acc.code} - ${acc.name}`
    }));

    return (
        <AuthenticatedLayout title="Expenses">
            <Head title="Expenses" />

            {flash.status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.status}</div>}

            <section className="grid gap-6 xl:grid-cols-3">
                {/* Record Expense Form */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
                    <h2 className="font-semibold text-slate-800 mb-4">Record Expense</h2>
                    <form onSubmit={submit} className="space-y-4">
                        <FloatingInput
                            id="expense_date"
                            name="expense_date"
                            type="date"
                            label="Expense Date"
                            required
                            value={form.data.expense_date}
                            onChange={(e) => form.setData('expense_date', e.target.value)}
                            error={form.errors.expense_date}
                        />

                        <SearchableSelect
                            id="expense_account_id"
                            name="expense_account_id"
                            label="Expense Category (Debit Account)"
                            required
                            options={expenseAccountOptions}
                            value={form.data.expense_account_id}
                            onChange={(e) => form.setData('expense_account_id', e.target.value)}
                            error={form.errors.expense_account_id}
                        />

                        <SearchableSelect
                            id="payment_account_id"
                            name="payment_account_id"
                            label="Paid From (Credit Account)"
                            required
                            options={paymentAccountOptions}
                            value={form.data.payment_account_id}
                            onChange={(e) => form.setData('payment_account_id', e.target.value)}
                            error={form.errors.payment_account_id}
                        />

                        <FloatingInput
                            id="amount"
                            name="amount"
                            type="number"
                            step="any"
                            label="Amount"
                            required
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', e.target.value)}
                            error={form.errors.amount}
                            placeholder="Amount in PKR"
                        />

                        <FloatingInput
                            id="reference"
                            name="reference"
                            label="Reference (Optional)"
                            value={form.data.reference}
                            onChange={(e) => form.setData('reference', e.target.value)}
                            error={form.errors.reference}
                            placeholder="Receipt number, check number..."
                        />

                        <div className="relative w-full">
                            <textarea
                                id="notes"
                                name="notes"
                                required
                                value={form.data.notes ?? ''}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder=" "
                                className="peer block w-full rounded-xl border border-slate-200 bg-white px-4 pb-2.5 pt-5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 min-h-[80px]"
                            />
                            <label
                                htmlFor="notes"
                                className="absolute left-4 top-2 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-xs text-slate-400 duration-150 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
                            >
                                Notes
                            </label>
                            {form.errors.notes && <p className="mt-1 text-xs text-red-600 font-normal">{form.errors.notes}</p>}
                        </div>

                        <button
                            disabled={form.processing}
                            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-900 disabled:opacity-60"
                        >
                            Save Expense
                        </button>
                    </form>
                </div>

                {/* Expense List */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <h2 className="font-semibold text-slate-800">Expense Log</h2>
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Expense Date</th>
                                    <th>Number</th>
                                    <th>Category</th>
                                    <th>Paid From</th>
                                    <th className="text-right">Amount</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 text-slate-600">{expense.expense_date}</td>
                                        <td className="font-semibold text-slate-800">{expense.number}</td>
                                        <td>{expense.expense_account.name}</td>
                                        <td>{expense.payment_account.name}</td>
                                        <td className="text-right font-bold text-slate-900">
                                            PKR {Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-xs text-slate-500 max-w-48 truncate" title={expense.notes}>
                                            {expense.notes}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {expenses.length === 0 && (
                        <p className="mt-6 text-center text-slate-400 text-sm">No expenses recorded yet.</p>
                    )}
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

