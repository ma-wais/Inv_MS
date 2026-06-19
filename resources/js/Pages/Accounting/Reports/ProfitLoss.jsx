import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function ProfitLoss({ profitAndLoss }) {
    const isProfit = Number(profitAndLoss.net_profit) >= 0;

    return (
        <AuthenticatedLayout title="Profit & Loss Statement">
            <Head title="Profit & Loss Statement" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-800">Income Statement</h1>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Accrual Basis</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                    {/* Header */}
                    <div className="text-center border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-800">Ventory Statement of Profit or Loss</h2>
                        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">For the current period</p>
                    </div>

                    {/* Revenues Section */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Revenues</h3>
                        <div className="space-y-2.5">
                            {profitAndLoss.revenue_items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-slate-50">
                                    <span className="text-slate-700 font-semibold">{item.name} ({item.code})</span>
                                    <span className="text-slate-800 font-medium">PKR {money(item.credit - item.debit)}</span>
                                </div>
                            ))}
                            {profitAndLoss.revenue_items.length === 0 && (
                                <p className="text-xs text-slate-400 italic">No revenue recorded yet.</p>
                            )}
                            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2">
                                <span>Total Revenue</span>
                                <span>PKR {money(profitAndLoss.total_revenue)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Cost of Goods Sold & Expenses</h3>
                        <div className="space-y-2.5">
                            {profitAndLoss.expense_items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-slate-50">
                                    <span className="text-slate-700 font-semibold">{item.name} ({item.code})</span>
                                    <span className="text-slate-800 font-medium">PKR {money(item.debit - item.credit)}</span>
                                </div>
                            ))}
                            {profitAndLoss.expense_items.length === 0 && (
                                <p className="text-xs text-slate-400 italic">No expenses recorded yet.</p>
                            )}
                            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2">
                                <span>Total Expenses</span>
                                <span>PKR {money(profitAndLoss.total_expense)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Box */}
                    <div className={`rounded-xl p-5 flex justify-between items-center ${
                        isProfit ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
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
