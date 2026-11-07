import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import Pagination from '../../../Components/Pagination';
import React, { useState } from 'react';

export default function Index({ sales, filters = {} }) {
    const { flash } = usePage().props;

    const [searchVal, setSearchVal] = useState(filters.search || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [sortField, setSortField] = useState(filters.sort || 'id');
    const [sortDirection, setSortDirection] = useState(filters.direction || 'desc');

    const handleSort = (field) => {
        const nextDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(nextDirection);
        router.get('/sales', {
            search: searchVal,
            start_date: startDate,
            end_date: endDate,
            sort: field,
            direction: nextDirection
        }, { preserveState: true });
    };

    const handleFilter = (e) => {
        e.preventDefault();
        router.get('/sales', {
            search: searchVal,
            start_date: startDate,
            end_date: endDate,
            sort: sortField,
            direction: sortDirection
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearchVal('');
        setStartDate('');
        setEndDate('');
        router.get('/sales', {}, { preserveState: true });
    };

    return (
        <AuthenticatedLayout title="Sales Invoices">
            <Head title="Sales" />
            {flash.status && <div className="mb-5 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">{flash.status}</div>}

            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-surface-muted p-4 rounded-2xl border border-line/60">
                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-3 flex-1">
                    <input
                        type="text"
                        placeholder="Search invoice number, customer..."
                        value={searchVal}
                        onChange={(e) => setSearchVal(e.target.value)}
                        className="rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-emerald-500 w-full sm:w-60"
                    />
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-subtle font-semibold uppercase">From</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-subtle font-semibold uppercase">To</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-emerald-500"
                        />
                    </div>
                    <button type="submit" className="rounded-xl bg-action px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer">Filter</button>
                    {(searchVal || startDate || endDate) && (
                        <button type="button" onClick={clearFilters} className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors cursor-pointer">Clear</button>
                    )}
                </form>
                <Link href="/pos" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">Go to POS / Register</Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-muted text-xs uppercase text-muted">
                            <tr>
                                <th className="px-5 py-4 cursor-pointer hover:bg-surface-hover/50 select-none" onClick={() => handleSort('number')}>
                                    Number {sortField === 'number' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="cursor-pointer hover:bg-surface-hover/50 select-none" onClick={() => handleSort('customer')}>
                                    Customer {sortField === 'customer' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="cursor-pointer hover:bg-surface-hover/50 select-none" onClick={() => handleSort('warehouse')}>
                                    Warehouse {sortField === 'warehouse' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th>Status</th>
                                <th className="cursor-pointer hover:bg-surface-hover/50 select-none" onClick={() => handleSort('total')}>
                                    Total {sortField === 'total' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="cursor-pointer hover:bg-surface-hover/50 select-none" onClick={() => handleSort('outstanding')}>
                                    Outstanding {sortField === 'outstanding' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="text-right px-5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line-soft">
                            {sales.data.map((sale) => (
                                <tr key={sale.id} className="hover:bg-surface-muted/20">
                                    <td className="px-5 py-4"><Link href={`/sales/${sale.id}`} className="font-semibold text-success-ink hover:underline">{sale.number}</Link></td>
                                    <td className="text-foreground font-medium">{sale.customer.name}</td>
                                    <td className="text-muted text-xs">{sale.warehouse.name}</td>
                                    <td className="capitalize">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${
                                            sale.status === 'posted' ? 'bg-success-soft text-success-ink' : 'bg-surface-hover text-foreground'
                                        }`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="text-foreground font-medium">{money(sale.grand_total)}</td>
                                    <td className="font-bold text-foreground">{money(sale.outstanding)}</td>
                                    <td className="text-right px-5 py-2">
                                        <div className="flex justify-end gap-1.5">
                                            <Link
                                                href={`/sales/${sale.id}`}
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border border-line bg-surface text-foreground hover:bg-surface-muted transition-colors"
                                            >
                                                View
                                            </Link>
                                            <a
                                                href={`/sales/${sale.id}?print=true`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-line bg-surface text-foreground hover:bg-surface-muted transition-colors"
                                            >
                                                Print
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sales.data.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-5 py-8 text-center text-subtle">
                                        No sales records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination links={sales.links} />
            </div>
        </AuthenticatedLayout>
    );
}

function money(value) {
    return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
