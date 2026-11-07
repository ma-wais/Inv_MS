import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export const periods = [['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'Last 7 days'], ['month', 'This month'], ['custom', 'Custom range']];

export default function PeriodControls({ filters, url = '/dashboard' }) {
    const [dates, setDates] = useState({ start_date: filters.start_date, end_date: filters.end_date });
    const [pending, setPending] = useState(false);
    useEffect(() => setDates({ start_date: filters.start_date, end_date: filters.end_date }), [filters.start_date, filters.end_date]);
    function visit(data) {
        router.get(url, data, { preserveState: true, preserveScroll: true, onStart: () => setPending(true), onFinish: () => setPending(false) });
    }
    return <form onSubmit={event => { event.preventDefault(); visit({ period: 'custom', ...dates }); }} className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
        <label className="text-xs font-semibold text-muted">Period<select aria-label="Dashboard period" value={filters.period} onChange={event => visit(event.target.value === 'custom' ? { period: 'custom', ...dates } : { period: event.target.value })} className="mt-1 block rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-foreground">{periods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-xs font-semibold text-muted">From<input type="date" aria-label="Dashboard start date" value={dates.start_date} required onChange={event => setDates({ ...dates, start_date: event.target.value })} className="mt-1 block rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-foreground" /></label>
        <label className="text-xs font-semibold text-muted">To<input type="date" aria-label="Dashboard end date" value={dates.end_date} required min={dates.start_date} onChange={event => setDates({ ...dates, end_date: event.target.value })} className="mt-1 block rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-foreground" /></label>
        <button disabled={pending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{pending ? 'Loading…' : 'Apply dates'}</button>
        <p className="ml-auto text-xs text-muted">{filters.start_date} — {filters.end_date}</p>
    </form>;
}
