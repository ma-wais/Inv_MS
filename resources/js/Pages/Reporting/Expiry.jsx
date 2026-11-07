import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import ExportCSVButton from '../../Components/ExportCSVButton';

export default function Expiry({ reportData }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, expired, expiring_soon, good

    // Counts
    const expiredCount = reportData.filter(item => item.status === 'expired').length;
    const expiringSoonCount = reportData.filter(item => item.status === 'expiring_soon').length;
    const goodCount = reportData.filter(item => item.status === 'good').length;

    const filteredData = reportData.filter(item => {
        const query = search.toLowerCase();
        const matchesQuery = (
            item.batch_number?.toLowerCase().includes(query) ||
            item.sku?.toLowerCase().includes(query) ||
            item.variant_name?.toLowerCase().includes(query) ||
            item.product_name?.toLowerCase().includes(query)
        );

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        return matchesQuery && matchesStatus;
    });

    const totalStock = filteredData.reduce((sum, item) => sum + Number(item.stock_quantity), 0);

    const columns = [
        { key: 'batch_number', label: 'Batch Number' },
        { key: 'sku', label: 'SKU' },
        { key: 'product_name', label: 'Product Name' },
        { key: 'variant_name', label: 'Variant Name' },
        { key: 'expires_at', label: 'Expiry Date' },
        { key: 'days_to_expiry', label: 'Days to Expiry' },
        { key: 'stock_quantity', label: 'Stock Quantity' },
        { key: 'status', label: 'Status' }
    ];

    return (
        <AuthenticatedLayout title="Expiry & Alerts">
            <Head title="Expiry & Alerts" />

            <div className="w-full space-y-6">
                {/* Heading & Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Batch Expiry & Alerts</h1>
                        <p className="text-sm text-muted">Track shelf-life and product batches nearing expiration or already expired.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ExportCSVButton 
                            data={filteredData} 
                            columns={columns} 
                            filename={`batch-expiry-${new Date().toISOString().split('T')[0]}.csv`} 
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

                {/* Print Header */}
                <div className="hidden print:block border-b border-line pb-4">
                    <h1 className="text-2xl font-bold text-foreground">Batch Expiry & Alerts</h1>
                    <p className="text-sm text-muted">Generated on: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Total Batches</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{reportData.length}</p>
                    </div>
                    <div className="rounded-2xl border border-danger-ink/30 bg-danger-soft/20 p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Expired Batches</p>
                        <p className="mt-2 text-2xl font-bold text-danger-ink">{expiredCount}</p>
                    </div>
                    <div className="rounded-2xl border border-warning-ink/30 bg-warning-soft/20 p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-warning-ink">Expiring Soon (&lt;90d)</p>
                        <p className="mt-2 text-2xl font-bold text-warning-ink">{expiringSoonCount}</p>
                    </div>
                    <div className="rounded-2xl border border-success-ink/30 bg-success-soft/20 p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-success-ink">Good Status</p>
                        <p className="mt-2 text-2xl font-bold text-success-ink">{goodCount}</p>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-line print:hidden">
                    {/* Status Tabs */}
                    <div className="flex rounded-lg bg-surface-hover p-0.5 text-xs font-medium text-muted">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`rounded-md px-3 py-1.5 transition ${statusFilter === 'all' ? 'bg-surface font-bold text-foreground shadow-xs' : 'hover:text-foreground'}`}
                        >
                            All ({reportData.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('expired')}
                            className={`rounded-md px-3 py-1.5 transition ${statusFilter === 'expired' ? 'bg-surface font-bold text-danger-ink shadow-xs' : 'hover:text-danger-ink'}`}
                        >
                            Expired ({expiredCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('expiring_soon')}
                            className={`rounded-md px-3 py-1.5 transition ${statusFilter === 'expiring_soon' ? 'bg-surface font-bold text-warning-ink shadow-xs' : 'hover:text-warning-ink'}`}
                        >
                            Expiring Soon ({expiringSoonCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('good')}
                            className={`rounded-md px-3 py-1.5 transition ${statusFilter === 'good' ? 'bg-surface font-bold text-success-ink shadow-xs' : 'hover:text-success-ink'}`}
                        >
                            Good ({goodCount})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search by SKU, Batch, Product..."
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
                                    <th className="px-4 py-3">Batch Number</th>
                                    <th>SKU</th>
                                    <th>Product</th>
                                    <th>Variant</th>
                                    <th>Expiry Date</th>
                                    <th className="text-right">Days left</th>
                                    <th className="text-right">Stock Qty</th>
                                    <th className="text-center px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft">
                                {filteredData.length > 0 ? (
                                    filteredData.map((row) => (
                                        <tr key={row.id} className="hover:bg-surface-muted/20">
                                            <td className="px-4 py-3 font-semibold text-foreground">{row.batch_number}</td>
                                            <td className="font-mono text-xs text-muted">{row.sku}</td>
                                            <td className="font-semibold text-foreground">{row.product_name}</td>
                                            <td className="text-muted">{row.variant_name}</td>
                                            <td className="text-muted font-medium">{row.expires_at}</td>
                                            <td className={`text-right font-medium ${row.days_to_expiry < 0 ? 'text-danger-ink' : row.days_to_expiry <= 90 ? 'text-warning-ink' : 'text-muted'}`}>
                                                {row.days_to_expiry < 0 
                                                    ? `Expired (${Math.abs(row.days_to_expiry)}d ago)` 
                                                    : `${row.days_to_expiry} days`
                                                }
                                            </td>
                                            <td className="text-right font-bold text-foreground">{row.stock_quantity.toLocaleString()}</td>
                                            <td className="text-center px-4">
                                                {row.status === 'expired' && (
                                                    <span className="inline-block rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-bold text-danger-ink">
                                                        Expired
                                                    </span>
                                                )}
                                                {row.status === 'expiring_soon' && (
                                                    <span className="inline-block rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-bold text-warning-ink">
                                                        Near Expiry
                                                    </span>
                                                )}
                                                {row.status === 'good' && (
                                                    <span className="inline-block rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-bold text-success-ink">
                                                        Good
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-muted">
                                            No matching items found.
                                        </td>
                                    </tr>
                                )}
                                <tr className="bg-surface-muted font-bold border-t-2 border-line">
                                    <td className="px-4 py-3 text-foreground" colSpan="6">Total Filtered Stock</td>
                                    <td className="text-right text-foreground">{totalStock.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
