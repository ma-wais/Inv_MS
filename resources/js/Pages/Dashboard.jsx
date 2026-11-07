import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import PeriodControls, { periods } from '../Components/PeriodControls';
import ShopAvatar from '../Components/ShopAvatar';

const cards = [
    ['sales', 'Net sales', 'After return credits', '↑', 'success'],
    ['purchases', 'Net purchases', 'After supplier returns', '↓', 'info'],
    ['expenses', 'Expenses', 'Posted in this period', '−', 'warning'],
    ['cash', 'Cash balance', 'Balance at end date', '₨', 'success'],
    ['receivables', 'Receivable ledger', 'Balance at end date', '↔', 'info'],
    ['low-stock', 'Low stock', 'Live SKUs at reorder level', '!', 'warning'],
];
const colors = {
    success: 'bg-success-soft text-success-ink', info: 'bg-info-soft text-info-ink', warning: 'bg-warning-soft text-warning-ink',
};
const money = value => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard({ summary, branches, charts, filters }) {
    const { auth, errors } = usePage().props;
    const currency = auth.tenant.currency;
    const financial = auth.permissions.includes('accounting.manage');
    const query = new URLSearchParams({ period: filters.period, start_date: filters.start_date, end_date: filters.end_date }).toString();
    function periodChange(period) {
        router.get('/dashboard', period === 'custom' ? { period, start_date: filters.start_date, end_date: filters.end_date } : { period }, { preserveState: true, preserveScroll: true });
    }
    return <AuthenticatedLayout title="Dashboard">
        <Head title="Dashboard" />
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center gap-4"><ShopAvatar name={auth.tenant.name} logo={auth.tenant.logo_url} className="h-14 w-14" /><div><p className="text-xs font-semibold uppercase tracking-widest text-success-ink">Daily shop overview</p><h1 className="mt-1 text-xl font-bold">{auth.tenant.name}</h1><p className="mt-1 text-xs text-muted">{filters.label} · {auth.tenant.timezone}</p></div></div>
                <Link href="/pos" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">New sale →</Link>
            </div>
            <PeriodControls filters={filters} />
            {(errors.start_date || errors.end_date || errors.period) && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger-ink">{errors.start_date || errors.end_date || errors.period}</p>}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.filter(([key]) => summary[key] !== undefined).map(([key, title, note, symbol, color]) => <article key={key} data-metric={key} className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-colors hover:border-emerald-500/50">
                    <Link href={`/dashboard/metrics/${key}?${query}`} className="block p-5" aria-label={`View ${title.toLowerCase()} details`}>
                        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted">{title}</p><span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold ${colors[color]}`}>{symbol}</span></div>
                        <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{key === 'low-stock' ? summary[key] : <><span className="mr-2 text-sm font-medium text-muted">{currency}</span>{money(summary[key])}</>}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted"><span>{note}{['cash', 'receivables'].includes(key) ? ` · ${filters.end_date}` : ''}</span><span className="text-success-ink">Details →</span></div>
                    </Link>
                    {key !== 'low-stock' && <div className="border-t border-line-soft bg-surface-muted/50 px-5 py-2"><label className="flex items-center justify-between gap-3 text-xs text-muted">Reporting period<select aria-label={`${title} period`} value={filters.period} onChange={event => periodChange(event.target.value)} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-foreground">{periods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>}
                </article>)}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                {Object.entries(charts).map(([key, data]) => <HistoryChart key={key} kind={key} data={data} currency={currency} endDate={filters.end_date} />)}
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
                <section className="rounded-2xl border border-line bg-surface p-5 lg:col-span-2"><h2 className="font-semibold">Quick actions</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{[['/products/create', 'Add product', 'Inventory & pricing'], ['/purchases/create', 'New purchase', 'Receive supplier stock'], ['/customers', 'Customers', 'Payments & khata'], ...(financial ? [['/reports/profit-loss', 'Profit & loss', 'Revenue and expenses']] : [['/stock', 'Stock', 'Balances and movements']])].map(([url, title, note]) => <Link key={url} href={url} className="rounded-xl border border-line-soft bg-surface-muted p-4 hover:bg-surface-hover"><p className="text-sm font-semibold">{title} →</p><p className="mt-1 text-xs text-muted">{note}</p></Link>)}</div></section>
                <section className="rounded-2xl border border-line bg-surface p-5"><h2 className="font-semibold">Shop locations</h2><div className="mt-4 space-y-3">{branches.map(branch => <div key={branch.id} className="flex items-center justify-between rounded-xl bg-surface-muted p-3"><div><p className="text-sm font-medium">{branch.name}</p><p className="text-xs text-muted">{branch.code}</p></div>{branch.is_default && <span className="rounded-full bg-success-soft px-2 py-1 text-xs text-success-ink">Default</span>}</div>)}</div></section>
            </div>
        </div>
    </AuthenticatedLayout>;
}

function HistoryChart({ kind, data, currency, endDate }) {
    const maximum = Math.max(...data.map(row => Math.abs(row.total)), 1);
    return <section className="rounded-2xl border border-line bg-surface p-5"><h2 className="font-semibold capitalize">{kind} trend</h2><p className="mt-1 text-xs text-muted">7 days ending {endDate}{kind !== 'expenses' ? ' · net of returns' : ''}</p><div className="mt-5 grid h-40 grid-cols-7 gap-2 border-b border-line-soft">{data.map(row => <Link key={row.date} href={`/dashboard/metrics/${kind}?period=custom&start_date=${row.date}&end_date=${row.date}`} aria-label={`${row.date} ${kind}: ${currency} ${money(row.total)}`} title={`${row.date}: ${currency} ${money(row.total)}`} className="group relative flex h-full flex-col items-center justify-end"><div className={`w-full max-w-7 rounded-t-md transition-opacity group-hover:opacity-70 ${row.total < 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ height: `${Math.max(2, Math.abs(row.total) / maximum * 80)}%` }} /><span className="absolute -bottom-5 text-[10px] text-muted">{row.day}</span></Link>)}</div><p className="mt-8 text-[10px] text-muted">Hover for amount · click a day for details · red indicates net returns.</p></section>;
}
