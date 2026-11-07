import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useState } from 'react';

export default function TrialBalance({ trialBalance, filters }) {
    const [startDate, setStartDate] = useState(filters?.start_date ?? '');
    const [endDate, setEndDate] = useState(filters?.end_date ?? '');

    function handleFilterSubmit(e) {
        e.preventDefault();
        router.get(window.location.pathname, { start_date: startDate, end_date: endDate }, { preserveState: true });
    }

    const totalDebit = trialBalance.reduce((sum, row) => sum + Number(row.debit), 0);
    const totalCredit = trialBalance.reduce((sum, row) => sum + Number(row.credit), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.0001;

    return (
        <AuthenticatedLayout title="Trial Balance">
            <Head title="Trial Balance" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-foreground">Financial Reports</h1>
                    {isBalanced ? (
                        <span className="text-xs font-semibold text-success-ink bg-success-soft px-3 py-1 rounded-full">Balanced ✅</span>
                    ) : (
                        <span className="text-xs font-semibold text-danger-ink bg-danger-soft px-3 py-1 rounded-full">Unbalanced (Diff: PKR {difference.toLocaleString()}) ❌</span>
                    )}
                </div>

                <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4 bg-surface p-5 rounded-2xl border border-line shadow-sm print:hidden">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-muted uppercase mb-1">Date From</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm outline-none focus:border-emerald-500 font-medium text-foreground"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-muted uppercase mb-1">Date To</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm outline-none focus:border-emerald-500 font-medium text-foreground"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded-xl bg-action px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                        Apply Filter
                    </button>
                </form>

                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                    <h2 className="text-base font-bold text-foreground border-b border-line-soft pb-3 mb-4">Trial Balance Report</h2>
                    
                    <div className="overflow-hidden rounded-xl border border-line-soft">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase text-muted">
                                <tr>
                                    <th className="px-4 py-3">Account Code</th>
                                    <th>Account Name</th>
                                    <th>Account Type</th>
                                    <th className="text-right">Debit Balance</th>
                                    <th className="text-right px-4">Credit Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft">
                                {trialBalance.map((row) => (
                                    <tr key={row.id} className="hover:bg-surface-muted/20">
                                        <td className="px-4 py-2.5 font-medium text-muted">{row.code}</td>
                                        <td className="font-semibold text-foreground">{row.name}</td>
                                        <td className="capitalize text-muted text-xs">{row.type}</td>
                                        <td className="text-right text-foreground font-medium">
                                            {Number(row.debit) > 0 ? money(row.debit) : '—'}
                                        </td>
                                        <td className="text-right text-foreground font-medium px-4">
                                            {Number(row.credit) > 0 ? money(row.credit) : '—'}
                                        </td>
                                    </tr>
                                ))}
                                {/* Total row */}
                                <tr className="bg-surface-muted font-bold border-t-2 border-line">
                                    <td className="px-4 py-3 text-foreground" colSpan="3">Total</td>
                                    <td className="text-right text-success-ink">
                                        PKR {money(totalDebit)}
                                    </td>
                                    <td className="text-right text-success-ink px-4">
                                        PKR {money(totalCredit)}
                                    </td>
                                </tr>
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
