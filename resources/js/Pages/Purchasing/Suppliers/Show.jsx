import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React from 'react';
import { formatDate } from '../../../Components/utils';
import FloatingInput from '../../../Components/FloatingInput';
import SearchableSelect from '../../../Components/SearchableSelect';

export default function Show({ supplier, ledger, purchases, payments, returns: supplierReturns }) {
    const { flash, errors } = usePage().props;
    const form = useForm({
        purchase_id: '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        method: 'cash',
        reference: '',
        notes: '',
    });

    function handleDelete() {
        if (confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
            router.delete(`/suppliers/${supplier.id}`);
        }
    }

    function submit(event) {
        event.preventDefault();
        form.post(`/suppliers/${supplier.id}/payments`, { preserveScroll: true, onSuccess: () => form.reset('amount', 'reference', 'notes') });
    }

    const purchaseOptions = purchases.map(p => ({
        value: p.id,
        label: `${p.number} - PKR ${money(p.outstanding)}`
    }));

    const methodOptions = [
        { value: 'cash', label: 'Cash' },
        { value: 'bank', label: 'Bank Transfer' },
        { value: 'card', label: 'Card Payment' },
        { value: 'mobile', label: 'Mobile Wallet' }
    ];

    return (
        <AuthenticatedLayout title={supplier.name}>
            <Head title={supplier.name} />

            {flash.status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.status}</div>}
            {errors?.error && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errors.error}</div>}

            <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
                    <h2 className="font-semibold text-slate-800">Supplier details</h2>
                    <dl className="mt-4 space-y-3 text-sm">
                        <Row label="Code" value={supplier.code} />
                        <Row label="Phone" value={supplier.phone ?? '—'} />
                        <Row label="Opening balance" value={money(supplier.opening_balance)} />
                        <Row label="Current balance" value={money(supplier.ledger_balance ?? 0)} />
                    </dl>
                    <div className="mt-5 flex gap-2">
                        <Link href="/purchases/create" className="w-full text-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-900">New purchase</Link>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <h2 className="font-semibold text-slate-800 mb-4">Record payment</h2>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SearchableSelect
                                id="purchase_id"
                                name="purchase_id"
                                label="Optional Purchase"
                                options={purchaseOptions}
                                value={form.data.purchase_id}
                                onChange={(e) => form.setData('purchase_id', e.target.value)}
                                error={form.errors.purchase_id}
                                empty="Optional purchase..."
                            />

                            <FloatingInput
                                id="payment_date"
                                name="payment_date"
                                type="date"
                                label="Payment Date"
                                required
                                value={form.data.payment_date}
                                onChange={(e) => form.setData('payment_date', e.target.value)}
                                error={form.errors.payment_date}
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

                            <SearchableSelect
                                id="method"
                                name="method"
                                label="Payment Method"
                                required
                                options={methodOptions}
                                value={form.data.method}
                                onChange={(e) => form.setData('method', e.target.value)}
                                error={form.errors.method}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FloatingInput
                                id="reference"
                                name="reference"
                                label="Reference (Optional)"
                                value={form.data.reference}
                                onChange={(e) => form.setData('reference', e.target.value)}
                                error={form.errors.reference}
                                placeholder="Receipt number, bank reference..."
                            />

                            <FloatingInput
                                id="notes"
                                name="notes"
                                label="Notes (Optional)"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                error={form.errors.notes}
                                placeholder="Notes about payment..."
                            />
                        </div>

                        {Object.values(form.errors)[0] && !form.errors.purchase_id && !form.errors.payment_date && !form.errors.amount && !form.errors.method && !form.errors.reference && !form.errors.notes && (
                            <p className="text-sm text-red-600">{Object.values(form.errors)[0]}</p>
                        )}
                        <button disabled={form.processing} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-900 disabled:opacity-60">Save payment</button>
                    </form>
                </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-3">
                <LedgerCard title="Ledger" rows={ledger} />
                <ListCard title="Purchases" items={purchases} render={(item) => <Link href={`/purchases/${item.id}`} className="text-emerald-700 hover:underline">{item.number}</Link>} />
                <ListCard title="Returns" items={supplierReturns} render={(item) => item.number} />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-slate-800">Payments</h2>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th>Number</th><th>Method</th><th>Amount</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="px-4 py-3 text-slate-600">{formatDate(payment.payment_date)}</td>
                                    <td className="font-medium text-slate-800">{payment.number}</td>
                                    <td className="capitalize text-slate-600">{payment.method}</td>
                                    <td className="font-semibold text-slate-900">{money(payment.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

function LedgerCard({ title, rows }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <h2 className="font-semibold text-slate-800">{title}</h2>
            <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th>Type</th><th>Number</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((row, index) => (
                            <tr key={index} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 text-slate-600">{row.date ? formatDate(row.date) : 'Opening'}</td>
                                <td className="capitalize">{row.type}</td>
                                <td>{row.number}</td>
                                <td className="text-slate-950 font-semibold">{money(row.debit)}</td>
                                <td className="text-slate-950 font-semibold">{money(row.credit)}</td>
                                <td className="font-semibold text-emerald-800">{money(row.balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ListCard({ title, items, render }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h2 className="font-semibold text-slate-800">{title}</h2>
            <div className="mt-4 space-y-2">
                {items.map((item) => <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">{render(item)}</div>)}
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return <div className="flex items-center justify-between gap-3"><dt className="text-slate-500">{label}</dt><dd className="font-medium">{value}</dd></div>;
}

function money(value) {
    return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

