import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useState } from 'react';

export default function ProfitLoss({ profitAndLoss, filters }) {
    const [startDate, setStartDate] = useState(filters?.start_date ?? '');
    const [endDate, setEndDate] = useState(filters?.end_date ?? '');

    function handleFilterSubmit(e) {
        e.preventDefault();
        router.get(window.location.pathname, { start_date: startDate, end_date: endDate }, { preserveState: true });
    }

    const isProfit = Number(profitAndLoss.net_profit) >= 0;

    return (
        <AuthenticatedLayout title="Profit & Loss Statement">
            <Head title="Profit & Loss Statement" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-foreground">Income Statement</h1>
                    <span className="text-xs text-subtle font-semibold uppercase tracking-wider">Accrual Basis</span>
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

                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-6">
                    {/* Header */}
                    <div className="text-center border-b border-line-soft pb-4">
                        <h2 className="text-lg font-bold text-foreground">Statement of Profit or Loss</h2>
                        <p className="text-xs text-subtle uppercase tracking-widest mt-1">For the current period</p>
                    </div>

                    {/* Revenues Section */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Revenues</h3>
                        <div className="space-y-2.5">
                            {profitAndLoss.revenue_items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-slate-50">
                                    <span className="text-foreground font-semibold">{item.name} ({item.code})</span>
                                    <span className="text-foreground font-medium">PKR {money(item.credit - item.debit)}</span>
                                </div>
                            ))}
                            {profitAndLoss.revenue_items.length === 0 && (
                                <p className="text-xs text-subtle italic">No revenue recorded yet.</p>
                            )}
                            <div className="flex justify-between text-sm font-bold text-foreground pt-2">
                                <span>Total Revenue</span>
                                <span>PKR {money(profitAndLoss.total_revenue)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Cost of Goods Sold & Expenses</h3>
                        <div className="space-y-2.5">
                            {profitAndLoss.expense_items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-slate-50">
                                    <span className="text-foreground font-semibold">{item.name} ({item.code})</span>
                                    <span className="text-foreground font-medium">PKR {money(item.debit - item.credit)}</span>
                                </div>
                            ))}
                            {profitAndLoss.expense_items.length === 0 && (
                                <p className="text-xs text-subtle italic">No expenses recorded yet.</p>
                            )}
                            <div className="flex justify-between text-sm font-bold text-foreground pt-2">
                                <span>Total Expenses</span>
                                <span>PKR {money(profitAndLoss.total_expense)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Box */}
                    <div className={`rounded-xl p-5 flex justify-between items-center ${
                        isProfit ? 'bg-success-soft text-success-ink' : 'bg-danger-soft text-danger-ink'
                    }`}>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider">Net Profit / (Loss)</p>
                            <p className="text-2xl font-bold mt-1">PKR {money(profitAndLoss.net_profit)}</p>
                        </div>
                        <span className="text-3xl">{isProfit ? '📈' : '📉'}</span>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function money(value) {
    return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
