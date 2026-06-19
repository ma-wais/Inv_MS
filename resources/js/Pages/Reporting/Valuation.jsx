import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import ExportCSVButton from '../../Components/ExportCSVButton';

export default function Valuation({ reportData }) {
    const [search, setSearch] = useState('');

    const filteredData = reportData.filter(item => {
        const query = search.toLowerCase();
        return (
            item.sku?.toLowerCase().includes(query) ||
            item.name?.toLowerCase().includes(query) ||
            item.product_name?.toLowerCase().includes(query)
        );
    });

    const totalStock = filteredData.reduce((sum, item) => sum + Number(item.stock_quantity), 0);
    const totalValuation = filteredData.reduce((sum, item) => sum + Number(item.valuation), 0);

    const columns = [
        { key: 'sku', label: 'SKU' },
        { key: 'product_name', label: 'Product Name' },
        { key: 'name', label: 'Variant Name' },
        { key: 'stock_quantity', label: 'Stock Quantity' },
        { key: 'unit', label: 'Unit' },
        { key: 'purchase_price', label: 'Purchase Cost' },
        { key: 'valuation', label: 'Total Valuation' }
    ];

    const money = (val) => Number(val ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <AuthenticatedLayout title="Inventory Valuation">
            <Head title="Inventory Valuation" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Heading & Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Inventory Valuation Report</h1>
                        <p className="text-sm text-slate-500">Real-time asset value based on average purchase price cost.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ExportCSVButton 
                            data={filteredData} 
                            columns={columns} 
                            filename={`inventory-valuation-${new Date().toISOString().split('T')[0]}.csv`} 
                        />
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-none transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="h-4 w-4 text-slate-500"
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

                {/* Print Header */}
                <div className="hidden print:block border-b border-slate-300 pb-4">
                    <h1 className="text-2xl font-bold text-slate-900">Inventory Valuation Report</h1>
                    <p className="text-sm text-slate-600">Generated on: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Variants</p>
                        <p className="mt-2 text-2xl font-bold text-slate-800">{filteredData.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Stock Qty</p>
                        <p className="mt-2 text-2xl font-bold text-slate-800">{totalStock.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs bg-emerald-50/30 border-emerald-100">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Asset Value</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-800">PKR {money(totalValuation)}</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 print:hidden">
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search by SKU, Product or Variant Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">SKU</th>
                                    <th>Product</th>
                                    <th>Variant</th>
                                    <th className="text-center">Unit</th>
                                    <th className="text-right">Stock Qty</th>
                                    <th className="text-right">Purchase Price</th>
                                    <th className="text-right px-4">Valuation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.length > 0 ? (
                                    filteredData.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/20">
                                            <td className="px-4 py-2.5 font-medium text-slate-600">{row.sku}</td>
                                            <td className="font-semibold text-slate-800">{row.product_name}</td>
                                            <td className="text-slate-600">{row.name}</td>
                                            <td className="text-center text-slate-500">{row.unit}</td>
                                            <td className="text-right font-medium text-slate-800">{row.stock_quantity.toLocaleString()}</td>
                                            <td className="text-right text-slate-600">{money(row.purchase_price)}</td>
                                            <td className="text-right text-slate-900 font-bold px-4">
                                                {money(row.valuation)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                                            No matching items found.
                                        </td>
                                    </tr>
                                )}
                                <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                    <td className="px-4 py-3 text-slate-900" colSpan="4">Total</td>
                                    <td className="text-right text-slate-900">{totalStock.toLocaleString()}</td>
                                    <td></td>
                                    <td className="text-right text-emerald-800 px-4">
                                        PKR {money(totalValuation)}
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
