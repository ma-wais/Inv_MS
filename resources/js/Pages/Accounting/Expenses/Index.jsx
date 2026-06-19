import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

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

    return (
        <AuthenticatedLayout title="Expenses">
            <Head title="Expenses" />

            {flash.status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.status}</div>}

            <section className="grid gap-6 xl:grid-cols-3">
                {/* Record Expense Form */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
                    <h2 className="font-semibold text-slate-800">Record Expense</h2>
                    <form onSubmit={submit} className="mt-4 space-y-3">
                        <label className="block text-sm font-medium text-slate-700">
                            Expense Date
                            <input 
                                type="date" 
                                required 
                                value={form.data.expense_date} 
                                onChange={(e) => form.setData('expense_date', e.target.value)} 
                                className={inputClass} 
                            />
                            {form.errors.expense_date && <span className="mt-1 block text-xs text-red-600">{form.errors.expense_date}</span>}
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Expense Category (Debit Account)
                            <select 
                                value={form.data.expense_account_id} 
                                onChange={(e) => form.setData('expense_account_id', e.target.value)} 
                                className={inputClass}
                            >
                                {expenseAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                ))}
                            </select>
                            {form.errors.expense_account_id && <span className="mt-1 block text-xs text-red-600">{form.errors.expense_account_id}</span>}
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Paid From (Credit Account)
                            <select 
                                value={form.data.payment_account_id} 
                                onChange={(e) => form.setData('payment_account_id', e.target.value)} 
                                className={inputClass}
                            >
                                {paymentAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                ))}
                            </select>
                            {form.errors.payment_account_id && <span className="mt-1 block text-xs text-red-600">{form.errors.payment_account_id}</span>}
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Amount
                            <input 
                                type="number" 
                                step="any"
                                required 
                                placeholder="Amount in PKR"
                                value={form.data.amount} 
                                onChange={(e) => form.setData('amount', e.target.value)} 
                                className={inputClass} 
                            />
                            {form.errors.amount && <span className="mt-1 block text-xs text-red-600">{form.errors.amount}</span>}
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Reference (Optional)
                            <input 
                                type="text" 
                                placeholder="Receipt number, check number..."
                                value={form.data.reference} 
                                onChange={(e) => form.setData('reference', e.target.value)} 
                                className={inputClass} 
                            />
                            {form.errors.reference && <span className="mt-1 block text-xs text-red-600">{form.errors.reference}</span>}
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Notes
                            <textarea 
                                required
                                placeholder="What was this expense for?"
                                value={form.data.notes} 
                                onChange={(e) => form.setData('notes', e.target.value)} 
                                className={`${inputClass} min-h-20`} 
                            />
                            {form.errors.notes && <span className="mt-1 block text-xs text-red-600">{form.errors.notes}</span>}
                        </label>

                        <button 
                            disabled={form.processing} 
                            className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-slate-800"
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

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white';
