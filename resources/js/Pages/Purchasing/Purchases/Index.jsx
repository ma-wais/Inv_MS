import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Index({ purchases }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout title="Purchases">
            <Head title="Purchases" />
            {flash.status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.status}</div>}

            <div className="mb-4 flex justify-end">
                <Link href="/purchases/create" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">New purchase</Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Number</th><th>Supplier</th><th>Warehouse</th><th>Status</th><th>Total</th><th>Outstanding</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {purchases.data.map((purchase) => (
                            <tr key={purchase.id}>
                                <td className="px-5 py-4"><Link href={`/purchases/${purchase.id}`} className="font-medium text-emerald-700 hover:underline">{purchase.number}</Link></td>
                                <td>{purchase.supplier.name}</td>
                                <td>{purchase.warehouse.name}</td>
                                <td className="capitalize">{purchase.status}</td>
                                <td>{money(purchase.grand_total)}</td>
                                <td className="font-semibold">{money(purchase.grand_total - purchase.paid_total)}</td>
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
