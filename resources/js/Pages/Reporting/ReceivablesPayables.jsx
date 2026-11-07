import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import ExportCSVButton from '../../Components/ExportCSVButton';

export default function ReceivablesPayables({ receivables, payables, total_receivables, total_payables }) {
    const [searchCustomer, setSearchCustomer] = useState('');
    const [searchSupplier, setSearchSupplier] = useState('');

    const filteredReceivables = receivables.filter(item => {
        const query = searchCustomer.toLowerCase();
        return (
            item.code?.toLowerCase().includes(query) ||
            item.name?.toLowerCase().includes(query) ||
            item.phone?.toLowerCase().includes(query)
        );
    });

    const filteredPayables = payables.filter(item => {
        const query = searchSupplier.toLowerCase();
        return (
            item.code?.toLowerCase().includes(query) ||
            item.name?.toLowerCase().includes(query) ||
            item.phone?.toLowerCase().includes(query)
        );
    });

    const currentFilteredReceivablesTotal = filteredReceivables.reduce((sum, item) => sum + Number(item.balance), 0);
    const currentFilteredPayablesTotal = filteredPayables.reduce((sum, item) => sum + Number(item.balance), 0);

    const netOutstanding = total_receivables - total_payables;

    const customerColumns = [
        { key: 'code', label: 'Customer Code' },
        { key: 'name', label: 'Customer Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'balance', label: 'Outstanding Balance' }
    ];

    const supplierColumns = [
        { key: 'code', label: 'Supplier Code' },
        { key: 'name', label: 'Supplier Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'balance', label: 'Outstanding Balance' }
    ];

    const money = (val) => Number(val ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <AuthenticatedLayout title="Receivables & Payables">
            <Head title="Receivables & Payables" />

            <div className="w-full space-y-6">
                {/* Heading & Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Receivables & Payables</h1>
                        <p className="text-sm text-muted">Summary of outstanding balances from customers (receivables) and owed to suppliers (payables).</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-surface-muted focus:outline-none transition-colors align-self-end sm:align-self-auto"
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
                        Print Statement
                    </button>
                </div>

                {/* Print Header */}
                <div className="hidden print:block border-b border-line pb-4">
                    <h1 className="text-2xl font-bold text-foreground">Receivables & Payables Report</h1>
                    <p className="text-sm text-muted">Generated on: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs bg-success-soft/10 border-success-ink/20">
                        <p className="text-xs font-semibold uppercase tracking-wider text-success-ink">Total Customer Receivables</p>
                        <p className="mt-2 text-2xl font-bold text-success-ink">PKR {money(total_receivables)}</p>
                    </div>
                    <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs bg-danger-soft/10 border-danger-ink/20">
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Total Supplier Payables</p>
                        <p className="mt-2 text-2xl font-bold text-danger-ink">PKR {money(total_payables)}</p>
                    </div>
                    <div className={`rounded-2xl border p-5 shadow-xs ${netOutstanding >= 0 ? 'bg-success-soft/30 border-success-ink/30' : 'bg-danger-soft/30 border-danger-ink/30'}`}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Net Outstanding position</p>
                        <p className={`mt-2 text-2xl font-bold ${netOutstanding >= 0 ? 'text-success-ink' : 'text-danger-ink'}`}>
                            PKR {money(netOutstanding)} 
                            <span className="text-xs font-medium ml-1.5 text-muted">
                                ({netOutstanding >= 0 ? 'Net Receivable' : 'Net Payable'})
                            </span>
                        </p>
                    </div>
                </div>

                {/* Two-Column Grid for Receivables and Payables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Receivables Table Card */}
                    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3 mb-4">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Customer Receivables</h2>
                                <p className="text-xs text-muted">Customers with outstanding positive ledger balances.</p>
                            </div>
                            <div className="print:hidden">
                                <ExportCSVButton 
                                    data={filteredReceivables} 
                                    columns={customerColumns} 
                                    filename={`customer-receivables-${new Date().toISOString().split('T')[0]}.csv`} 
                                />
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-4 print:hidden">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-4 w-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by Code, Customer Name, Phone..."
                                value={searchCustomer}
                                onChange={(e) => setSearchCustomer(e.target.value)}
                                className="w-full rounded-lg border border-line bg-surface-muted pl-9 pr-4 py-1.5 text-xs focus:border-emerald-500 focus:bg-surface focus:outline-hidden"
                            />
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-surface-muted text-xs uppercase text-muted">
                                    <tr>
                                        <th className="px-3 py-2">Code</th>
                                        <th>Customer</th>
                                        <th>Phone</th>
                                        <th className="text-right px-3">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line-soft">
                                    {filteredReceivables.length > 0 ? (
                                        filteredReceivables.map((row) => (
                                            <tr key={row.id} className="hover:bg-surface-muted/20">
                                                <td className="px-3 py-2 text-xs font-mono text-muted">{row.code}</td>
                                                <td className="font-semibold text-foreground">{row.name}</td>
                                                <td className="text-xs text-muted">{row.phone}</td>
                                                <td className="text-right font-bold text-foreground px-3">{money(row.balance)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-3 py-6 text-center text-xs text-subtle">
                                                No customers with outstanding receivables.
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="bg-surface-muted font-bold border-t-2 border-line">
                                        <td className="px-3 py-2 text-foreground text-xs" colSpan="3">Total Receivables</td>
                                        <td className="text-right text-success-ink px-3 text-sm">{money(currentFilteredReceivablesTotal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payables Table Card */}
                    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3 mb-4">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Supplier Payables</h2>
                                <p className="text-xs text-muted">Suppliers with outstanding positive ledger balances.</p>
                            </div>
                            <div className="print:hidden">
                                <ExportCSVButton 
                                    data={filteredPayables} 
                                    columns={supplierColumns} 
                                    filename={`supplier-payables-${new Date().toISOString().split('T')[0]}.csv`} 
                                />
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-4 print:hidden">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-4 w-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by Code, Supplier Name, Phone..."
                                value={searchSupplier}
                                onChange={(e) => setSearchSupplier(e.target.value)}
                                className="w-full rounded-lg border border-line bg-surface-muted pl-9 pr-4 py-1.5 text-xs focus:border-emerald-500 focus:bg-surface focus:outline-hidden"
                            />
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-surface-muted text-xs uppercase text-muted">
                                    <tr>
                                        <th className="px-3 py-2">Code</th>
                                        <th>Supplier</th>
                                        <th>Phone</th>
                                        <th className="text-right px-3">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line-soft">
                                    {filteredPayables.length > 0 ? (
                                        filteredPayables.map((row) => (
                                            <tr key={row.id} className="hover:bg-surface-muted/20">
                                                <td className="px-3 py-2 text-xs font-mono text-muted">{row.code}</td>
                                                <td className="font-semibold text-foreground">{row.name}</td>
                                                <td className="text-xs text-muted">{row.phone}</td>
                                                <td className="text-right font-bold text-foreground px-3">{money(row.balance)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-3 py-6 text-center text-xs text-subtle">
                                                No suppliers with outstanding payables.
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="bg-surface-muted font-bold border-t-2 border-line">
                                        <td className="px-3 py-2 text-foreground text-xs" colSpan="3">Total Payables</td>
                                        <td className="text-right text-danger-ink px-3 text-sm">{money(currentFilteredPayablesTotal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
