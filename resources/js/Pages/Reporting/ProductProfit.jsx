import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import ExportCSVButton from '../../Components/ExportCSVButton';

export default function ProductProfit({ reportData, filters }) {
    const [startDate, setStartDate] = useState(filters?.start_date ?? '');
    const [endDate, setEndDate] = useState(filters?.end_date ?? '');
    const [search, setSearch] = useState('');

    function handleFilterSubmit(e) {
        e.preventDefault();
        router.get(window.location.pathname, { start_date: startDate, end_date: endDate }, { preserveState: true });
    }

    const filteredData = reportData.filter(item => {
        const query = search.toLowerCase();
        return (
            item.sku?.toLowerCase().includes(query) ||
            item.name?.toLowerCase().includes(query) ||
            item.product_name?.toLowerCase().includes(query)
        );
    });

    const totalQtySold = filteredData.reduce((sum, item) => sum + Number(item.quantity_sold), 0);
    const totalRevenue = filteredData.reduce((sum, item) => sum + Number(item.revenue), 0);
    const totalCogs = filteredData.reduce((sum, item) => sum + Number(item.cogs), 0);
    const totalProfit = filteredData.reduce((sum, item) => sum + Number(item.profit), 0);

    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const columns = [
        { key: 'sku', label: 'SKU' },
        { key: 'product_name', label: 'Product Name' },
        { key: 'name', label: 'Variant Name' },
        { key: 'quantity_sold', label: 'Net Qty Sold' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'cogs', label: 'COGS' },
        { key: 'profit', label: 'Profit' }
    ];

    const money = (val) => Number(val ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <AuthenticatedLayout title="Product Profitability">
            <Head title="Product Profitability" />

            <div className="w-full space-y-6">
                {reportData.some(row => row.cost_history_missing) && <p role="alert" className="rounded-xl bg-warning-soft p-3 text-sm text-warning-ink">Some historical stock costs are unavailable. Profit for these rows is incomplete and needs review.</p>}
                {/* Heading & Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Product Profitability Report</h1>
                        <p className="text-sm text-muted">Net revenue and profit after returns. Costs are fixed when each sale is posted; returns use their own return date.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ExportCSVButton 
                            data={filteredData} 
                            columns={columns} 
                            filename={`product-profitability-${new Date().toISOString().split('T')[0]}.csv`} 
                        />
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-surface-muted focus:outline-none transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="h-4 w-4 text-muted"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.617 0-1.11-.474-1.12-1.09L5.9 18m11.76 0c.3-.03.598-.062.896-.096a1.125 1.125 0 0 0 .963-1.037l.49-5.904a1.125 1.125 0 0 0-1.117-1.218h-2.185c-.822 0-1.505-.591-1.637-1.401l-.215-1.327a1.125 1.125 0 0 0-1.109-.945H9.19c-.526 0-.973.372-1.07.887l-.216 1.309c-.134.814-.823 1.411-1.649 1.411H4.116a1.125 1.125 0 0 0-1.117 1.218l.49 5.904a1.125 1.125 0 0 0 .963 1.037c.298.034.597.066.896.096m2.029-3.957h7.5"
                                />
                            </svg>
                            Print Report
                        </button>
                    </div>
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

                {/* Print Header */}
                <div className="hidden print:block border-b border-line pb-4">
                    <h1 className="text-2xl font-bold text-foreground">Product Profitability Report</h1>
                    <p className="text-sm text-muted">Generated on: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Net Qty Sold</p>
                        <p className="mt-2 text-xl font-bold text-foreground">{totalQtySold.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Total Revenue</p>
                        <p className="mt-2 text-xl font-bold text-foreground">PKR {money(totalRevenue)}</p>
                    </div>
                    <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Total COGS</p>
                        <p className="mt-2 text-xl font-bold text-foreground">PKR {money(totalCogs)}</p>
                    </div>
                    <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs bg-success-soft/30 border-success-ink/20 md:col-span-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-success-ink">Total Gross Profit</p>
                                <p className="mt-2 text-xl font-bold text-success-ink">PKR {money(totalProfit)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold uppercase tracking-wider text-success-ink">Avg. Margin</p>
                                <p className="mt-2 text-xl font-bold text-success-ink">{overallMargin.toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-line print:hidden">
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search by SKU, Product or Variant Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-line bg-surface-muted pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:bg-surface focus:outline-hidden"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase text-muted">
                                <tr>
                                    <th className="px-4 py-3">SKU</th>
                                    <th>Product</th>
                                    <th>Variant</th>
                                    <th className="text-right">Net Qty Sold</th>
                                    <th className="text-right">Revenue</th>
                                    <th className="text-right">COGS (Cost)</th>
                                    <th className="text-right">Gross Profit</th>
                                    <th className="text-right px-4">Margin (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft">
                                {filteredData.length > 0 ? (
                                    filteredData.map((row, index) => {
                                        const margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
                                        return (
                                            <tr key={index} className="hover:bg-surface-muted/20">
                                                <td className="px-4 py-2.5 font-medium text-muted">{row.sku}</td>
                                                <td className="font-semibold text-foreground">{row.product_name}</td>
                                                <td className="text-muted">{row.name}</td>
                                                <td className="text-right font-medium text-foreground">{row.quantity_sold.toLocaleString()}</td>
                                                <td className="text-right text-muted">{money(row.revenue)}</td>
                                                <td className="text-right text-muted">{money(row.cogs)}</td>
                                                <td className="text-right text-foreground font-semibold">{money(row.profit)}</td>
                                                <td className="text-right font-bold text-success-ink px-4">
                                                    {margin.toFixed(2)}%
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-muted">
                                            No matching items found.
                                        </td>
                                    </tr>
                                )}
                                <tr className="bg-surface-muted font-bold border-t-2 border-line">
                                    <td className="px-4 py-3 text-foreground" colSpan="3">Total</td>
                                    <td className="text-right text-foreground">{totalQtySold.toLocaleString()}</td>
                                    <td className="text-right text-foreground">{money(totalRevenue)}</td>
                                    <td className="text-right text-foreground">{money(totalCogs)}</td>
                                    <td className="text-right text-success-ink">{money(totalProfit)}</td>
                                    <td className="text-right text-success-ink px-4">
                                        {overallMargin.toFixed(2)}%
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
