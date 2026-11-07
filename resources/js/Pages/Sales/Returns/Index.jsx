import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React from 'react';
import Pagination from '../../../Components/Pagination';
import { formatDate } from '../../../Components/utils';

export default function Index({ returns }) {
    const money = (val) => Number(val ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <AuthenticatedLayout title="Sales Returns">
            <Head title="Sales Returns" />

            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-foreground">Sales Returns History</h1>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-muted text-xs uppercase text-muted">
                            <tr>
                                <th className="px-5 py-4">Return Number</th>
                                <th>Sales Invoice</th>
                                <th>Customer</th>
                                <th>Warehouse</th>
                                <th>Return Date</th>
                                <th>Total Amount</th>
                                <th className="text-right px-5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line-soft">
                            {returns.data.map((ret) => (
                                <tr key={ret.id} className="hover:bg-surface-muted/20">
                                    <td className="px-5 py-4 font-semibold text-foreground">{ret.number}</td>
                                    <td>
                                        <Link href={`/sales/${ret.sale_id}`} className="font-semibold text-success-ink hover:underline">
                                            {ret.sale?.number ?? '—'}
                                        </Link>
                                    </td>
                                    <td className="text-foreground font-medium">{ret.customer?.name ?? '—'}</td>
                                    <td className="text-muted text-xs">{ret.warehouse?.name ?? '—'}</td>
                                    <td className="text-muted">{formatDate(ret.return_date)}</td>
                                    <td className="text-foreground font-medium">PKR {money(ret.total)}</td>
                                    <td className="text-right px-5 py-2">
                                        <Link
                                            href={`/sales/returns/${ret.id}`}
                                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-line bg-surface text-foreground hover:bg-surface-muted transition-colors"
                                        >
                                            View Invoice
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {returns.data.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-5 py-8 text-center text-subtle">
                                        No sales returns found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination links={returns.links} />
            </div>
        </AuthenticatedLayout>
    );
}
