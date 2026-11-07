import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React from 'react';
import { formatDate, today } from '../../../Components/utils';
import FloatingInput from '../../../Components/FloatingInput';
import SearchableSelect from '../../../Components/SearchableSelect';
import { formatCnic } from '../../../Components/contactFormatting';

export default function Show({ customer, ledger, sales, payments, returns: customerReturns }) {
    const { flash, errors } = usePage().props;
    const form = useForm({
        sale_id: '',
        payment_date: today(),
        amount: '',
        method: 'cash',
        reference: '',
        notes: '',
    });

    function handleDelete() {
        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            router.delete(`/customers/${customer.id}`);
        }
    }

    function submit(event) {
        event.preventDefault();
        form.post(`/customers/${customer.id}/payments`, { preserveScroll: true, onSuccess: () => form.reset('amount', 'reference', 'notes') });
    }

    const saleOptions = sales.map(s => ({
        value: s.id,
        label: `${s.number} - PKR ${money(s.outstanding)}`
    }));

    const methodOptions = [
        { value: 'cash', label: 'Cash' },
        { value: 'bank', label: 'Bank Transfer' },
        { value: 'card', label: 'Card Payment' },
        { value: 'mobile', label: 'Mobile Wallet' }
    ];

    return (
        <AuthenticatedLayout title={customer.name}>
            <Head title={customer.name} />

            {flash.status && <div className="mb-5 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">{flash.status}</div>}
            {errors?.error && <div className="mb-5 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger-ink">{errors.error}</div>}

            <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm h-fit">
                    <h2 className="font-semibold text-foreground">Customer details</h2>
                    <Link href={`/customers/${customer.id}/edit`} className="mt-2 inline-block text-sm font-semibold text-success-ink">Edit details</Link>
                    <dl className="mt-4 space-y-3 text-sm">
                        <Row label="Code" value={customer.code} />
                        <Row label="CNIC" value={customer.cnic ? formatCnic(customer.cnic) : '—'} />
                        <Row label="Phone" value={customer.phone ?? '—'} />
                        <Row label="Credit limit" value={customer.credit_limit ? money(customer.credit_limit) : 'Unlimited'} />
                        <Row label="Opening balance" value={money(customer.opening_balance)} />
                        <Row label="Current balance" value={money(customer.ledger_balance ?? 0)} />
                    </dl>
                    <div className="mt-5 flex gap-2">
                        <Link href="/pos" className="w-full text-center rounded-xl bg-action px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-900">New Sale / POS</Link>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger-ink hover:bg-danger-soft transition-colors cursor-pointer"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm xl:col-span-2">
                    <h2 className="font-semibold text-foreground mb-4">Record payment</h2>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SearchableSelect
                                id="sale_id"
                                name="sale_id"
                                label="Optional Invoice"
                                options={saleOptions}
                                value={form.data.sale_id}
                                onChange={(e) => form.setData('sale_id', e.target.value)}
                                error={form.errors.sale_id}
                                empty="Optional invoice..."
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

                        {Object.values(form.errors)[0] && !form.errors.sale_id && !form.errors.payment_date && !form.errors.amount && !form.errors.method && !form.errors.reference && !form.errors.notes && (
                            <p className="text-sm text-danger-ink">{Object.values(form.errors)[0]}</p>
                        )}
                        <button disabled={form.processing} className="w-full rounded-xl bg-action px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-900 disabled:opacity-60">Save payment</button>
                    </form>
                </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-3">
                <LedgerCard title="Ledger" rows={ledger} />
                <ListCard title="Sales Invoices" items={sales} render={(item) => <Link href={`/sales/${item.id}`} className="text-success-ink hover:underline">{item.number}</Link>} />
                <ListCard title="Returns" items={customerReturns} render={(item) => item.number} />
            </section>

            <section className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <h2 className="font-semibold text-foreground">Payments</h2>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-muted text-xs uppercase text-muted"><tr><th className="px-4 py-3">Date</th><th>Number</th><th>Method</th><th>Amount</th></tr></thead>
                        <tbody className="divide-y divide-line-soft">
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="px-4 py-3 text-muted">{formatDate(payment.payment_date)}</td>
                                    <td className="font-medium text-foreground">{payment.number}</td>
                                    <td className="capitalize text-muted">{payment.method}</td>
                                    <td className="font-semibold text-foreground">{money(payment.amount)}</td>
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
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm xl:col-span-2">
            <h2 className="font-semibold text-foreground">{title}</h2>
            <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-surface-muted text-xs uppercase text-muted"><tr><th className="px-4 py-3">Date</th><th>Type</th><th>Number</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                    <tbody className="divide-y divide-line-soft">
                        {rows.map((row, index) => (
                            <tr key={index} className="hover:bg-surface-muted/50">
                                <td className="px-4 py-3 text-muted">{row.date ? formatDate(row.date) : 'Opening'}</td>
                                <td className="capitalize">{row.type}</td>
                                <td>{row.number}</td>
                                <td className="text-foreground font-semibold">{money(row.debit)}</td>
                                <td className="text-foreground font-semibold">{money(row.credit)}</td>
                                <td className="font-semibold text-success-ink">{money(row.balance)}</td>
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
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm h-fit">
            <h2 className="font-semibold text-foreground">{title}</h2>
            <div className="mt-4 space-y-2">
                {items.map((item) => <div key={item.id} className="rounded-lg bg-surface-muted px-3 py-2 text-sm">{render(item)}</div>)}
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return <div className="flex items-center justify-between gap-3"><dt className="text-muted">{label}</dt><dd className="font-medium">{value}</dd></div>;
}

function money(value) {
    return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

