import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Index({ sales }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout title="Sales Invoices">
            <Head title="Sales" />
            {flash.status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.status}</div>}

            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-800">History</h1>
                <Link href="/pos" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Go to POS / Register</Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Number</th><th>Customer</th><th>Warehouse</th><th>Status</th><th>Total</th><th>Outstanding</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {sales.data.map((sale) => (
                            <tr key={sale.id}>
                                <td className="px-5 py-4"><Link href={`/sales/${sale.id}`} className="font-medium text-emerald-700 hover:underline">{sale.number}</Link></td>
                                <td>{sale.customer.name}</td>
                                <td>{sale.warehouse.name}</td>
                                <td className="capitalize">
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${
                                        sale.status === 'posted' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                                    }`}>
                                        {sale.status}
                                    </span>
                                </td>
                                <td>{money(sale.grand_total)}</td>
                                <td className="font-semibold">{money(sale.grand_total - sale.paid_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}

function money(value) {
    return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
