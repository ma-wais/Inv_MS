import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import Pagination from '../../Components/Pagination';
import PeriodControls from '../../Components/PeriodControls';

export default function DashboardMetric({ metric, title, filters, rows, opening_balance, closing_balance }) {
    const currency = usePage().props.auth.tenant.currency;
    const money = value => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return <AuthenticatedLayout title={title}>
        <Head title={title} />
        <div className="space-y-5">
            <Link href={`/dashboard?${new URLSearchParams({ period: filters.period, start_date: filters.start_date, end_date: filters.end_date })}`} className="text-sm font-semibold text-success-ink">← Dashboard</Link>
            <PeriodControls filters={filters} url={`/dashboard/metrics/${metric}`} />
            {opening_balance !== null && <div className="grid gap-4 sm:grid-cols-2">{[['Opening balance', opening_balance], ['Balance at end date', closing_balance]].map(([label, amount]) => <div key={label} className="rounded-xl border border-line bg-surface p-4"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-xl font-bold">{currency} {money(amount)}</p></div>)}</div>}
            {metric === 'low-stock' && <p className="text-sm text-muted">Current stock across warehouses, at or below each SKU's reorder level. Stock is live; the date selector applies to transaction metrics.</p>}
            <section className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-surface-muted text-xs uppercase text-muted"><tr><th className="p-4">Date</th><th className="p-4">Reference</th><th className="p-4">Details</th><th className="p-4 text-right">{metric === 'low-stock' ? 'Stock quantity' : `Amount (${currency})`}</th></tr></thead>
                    <tbody className="divide-y divide-line-soft">{rows.data.map((row, index) => <tr key={`${row.detail}-${row.id}-${index}`} className="hover:bg-surface-hover/50"><td className="whitespace-nowrap p-4 text-muted">{row.date || 'Live'}</td><td className="p-4 font-semibold">{row.href ? <Link className="text-success-ink" href={row.href}>{row.number}</Link> : row.number}</td><td className="p-4"><p>{row.description}</p><p className="mt-1 text-xs text-muted">{row.detail}</p></td><td className={`p-4 text-right font-mono ${Number(row.amount) < 0 ? 'text-danger-ink' : ''}`}>{metric === 'low-stock' ? Number(row.amount) : money(row.amount)}</td></tr>)}{!rows.data.length && <tr><td className="p-8 text-center text-muted" colSpan="4">No matching entries.</td></tr>}</tbody>
                </table></div>
                <Pagination links={rows.links} />
            </section>
        </div>
    </AuthenticatedLayout>;
}
