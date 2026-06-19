import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Index({ customers }) {
    const { flash } = usePage().props;
    const form = useForm({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        credit_limit: '',
        opening_balance: '0',
        notes: '',
    });

    function submit(event) {
        event.preventDefault();
        form.post('/customers', { preserveScroll: true, onSuccess: () => form.reset() });
    }

    return (
        <AuthenticatedLayout title="Customers">
            <Head title="Customers" />

            {flash.status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.status}</div>}

            <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold">Add customer</h2>
                    <form onSubmit={submit} className="mt-4 space-y-3">
                        {['name', 'contact_person', 'email', 'phone', 'address', 'credit_limit', 'opening_balance'].map((field) => (
                            <label key={field} className="block text-sm font-medium capitalize">
                                {field.replaceAll('_', ' ')}
                                {field === 'address' ? (
                                    <textarea value={form.data[field]} onChange={(e) => form.setData(field, e.target.value)} className={`${inputClass} min-h-24`} />
                                ) : (
                                    <input type={field === 'email' ? 'email' : (field === 'opening_balance' || field === 'credit_limit') ? 'number' : 'text'} step="any" value={form.data[field]} onChange={(e) => form.setData(field, e.target.value)} className={inputClass} />
                                )}
                                {form.errors[field] && <span className="mt-1 block text-xs text-red-600">{form.errors[field]}</span>}
                            </label>
                        ))}
                        <label className="block text-sm font-medium">
                            Notes
                            <textarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} className={`${inputClass} min-h-24`} />
                        </label>
                        <button disabled={form.processing} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Create customer</button>
                    </form>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <h2 className="font-semibold">Customer list</h2>
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Customer</th><th>Sales</th><th>Payments</th><th>Receivable Balance</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td className="px-4 py-3">
                                            <Link href={`/customers/${customer.id}`} className="font-medium text-emerald-700 hover:underline">{customer.name}</Link>
                                            <p className="text-xs text-slate-400">{customer.code}</p>
                                        </td>
                                        <td>{customer.sales_count}</td>
                                        <td>{customer.payments_count}</td>
                                        <td className="font-semibold">{money(customer.ledger_balance ?? 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

function money(value) {
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500';
