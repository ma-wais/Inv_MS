import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useState, useMemo } from 'react';
import { formatDate } from '../../../Components/utils';

export default function GeneralLedger({ accounts, selectedAccountId, ledger, filters }) {
    const [startDate, setStartDate] = useState(filters?.start_date ?? '');
    const [endDate, setEndDate] = useState(filters?.end_date ?? '');
    const [searchQuery, setSearchQuery] = useState('');

    function handleAccountChange(e) {
        const id = e.target.value;
        router.get('/reports/general-ledger', { account_id: id, start_date: startDate, end_date: endDate }, { preserveState: true });
    }

    function handleFilterSubmit(e) {
        e.preventDefault();
        router.get('/reports/general-ledger', { account_id: selectedAccountId, start_date: startDate, end_date: endDate }, { preserveState: true });
    }

    const filteredLedger = useMemo(() => {
        if (!searchQuery.trim()) return ledger;
        const q = searchQuery.toLowerCase();
        return ledger.filter(row => 
            String(row.entry_number ?? '').toLowerCase().includes(q) ||
            String(row.reference_number ?? '').toLowerCase().includes(q) ||
            String(row.description ?? '').toLowerCase().includes(q) ||
            String(row.date ?? '').toLowerCase().includes(q)
        );
    }, [ledger, searchQuery]);

    return (
        <AuthenticatedLayout title="General Ledger / Cash Book">
            <Head title="General Ledger" />

            <div className="space-y-6">
                {/* Account selector and date filters bar */}
                <div className="flex flex-wrap items-end gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex-1 min-w-[240px]">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Account</label>
                        <select
                            value={selectedAccountId ?? ''}
                            onChange={handleAccountChange}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white font-medium text-slate-700 focus:border-emerald-500 outline-none"
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                            ))}
                        </select>
                    </div>

                    <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-3 flex-[2] min-w-[320px]">
                        <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 font-medium text-slate-700"
                            />
                        </div>
                        <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 font-medium text-slate-700"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                            Apply Dates
                        </button>
                    </form>
                </div>

                {/* Ledger entries table */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">Ledger Statement</h2>
                            <p className="text-[10px] text-slate-400">Search transaction lines locally in real-time.</p>
                        </div>
                        <div className="w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search entry, description, ref..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-100">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-3 py-2">Date</th>
                                    <th>Entry #</th>
                                    <th>Ref Document</th>
                                    <th>Memo / Description</th>
                                    <th className="text-right">Debit</th>
                                    <th className="text-right">Credit</th>
                                    <th className="text-right px-3">Running Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLedger.map((row, index) => (
                                    <tr key={index} className="hover:bg-slate-50/20">
                                        <td className="px-3 py-2 text-slate-500 font-mono whitespace-nowrap">{formatDate(row.date)}</td>
                                        <td className="font-semibold text-slate-800">{row.entry_number}</td>
                                        <td className="text-[10px] text-slate-400 font-medium">
                                            {row.reference_number ? (
                                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono uppercase text-[9px]">
                                                    {row.reference_number}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="text-slate-650 max-w-xs truncate" title={row.description}>
                                            {row.description ?? '—'}
                                        </td>
                                        <td className="text-right text-slate-800 font-semibold">
                                            {Number(row.debit) > 0 ? money(row.debit) : '—'}
                                        </td>
                                        <td className="text-right text-slate-800 font-semibold">
                                            {Number(row.credit) > 0 ? money(row.credit) : '—'}
                                        </td>
                                        <td className="text-right text-emerald-800 font-bold px-3">
                                            PKR {money(row.balance)}
                                        </td>
                                    </tr>
                                ))}
                                {filteredLedger.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-6 text-center text-slate-400" colSpan="7">
                                            No transaction entries found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function money(value) {
    return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
