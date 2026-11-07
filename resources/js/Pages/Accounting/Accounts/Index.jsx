import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useState, useMemo } from 'react';

export default function Index({ accounts }) {
    const { flash } = usePage().props;
    const [searchQuery, setSearchQuery] = useState('');

    const money = (val) => {
        const num = Number(val ?? 0);
        return num > 0 
            ? `PKR ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
            : '—';
    };

    // Filter accounts based on search query
    const isSearching = searchQuery.trim() !== '';

    const flatFilteredAccounts = useMemo(() => {
        if (!isSearching) return [];
        const query = searchQuery.toLowerCase();
        return accounts.filter(acc => 
            acc.code.toLowerCase().includes(query) ||
            acc.name.toLowerCase().includes(query) ||
            acc.type.toLowerCase().includes(query)
        );
    }, [accounts, searchQuery, isSearching]);

    // Tree hierarchy roots
    const rootAccounts = useMemo(() => {
        return accounts.filter(a => !a.parent_id);
    }, [accounts]);

    return (
        <AuthenticatedLayout title="Chart of Accounts">
            <Head title="Chart of Accounts" />

            {flash.status && (
                <div className="mb-5 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">
                    {flash.status}
                </div>
            )}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Chart of Accounts</h1>
                    <p className="text-xs text-muted mt-1">Manage and view all ledger accounts and their current balances.</p>
                </div>
                <Link
                    href="/accounts/create"
                    className="rounded-xl bg-action px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                    Add Account
                </Link>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                {/* Detailed search bar */}
                <div className="mb-5 max-w-md">
                    <label htmlFor="account-search" className="sr-only">Search Accounts</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-subtle">
                            🔍
                        </span>
                        <input
                            id="account-search"
                            type="text"
                            placeholder="Search by code, name, type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-line bg-surface pl-9 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Accounts Table */}
                <div className="overflow-hidden rounded-xl border border-line-soft">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-surface-muted text-xs uppercase tracking-wider text-muted border-b border-line-soft">
                            <tr>
                                <th className="px-5 py-3.5 font-semibold">Code</th>
                                <th className="px-5 py-3.5 font-semibold">Account Name</th>
                                <th className="px-5 py-3.5 font-semibold">Type</th>
                                <th className="px-5 py-3.5 font-semibold text-right">Debit Balance</th>
                                <th className="px-5 py-3.5 font-semibold text-right">Credit Balance</th>
                                <th className="px-5 py-3.5 font-semibold text-center">Origin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line-soft bg-surface">
                            {isSearching ? (
                                /* flat search results */
                                flatFilteredAccounts.map(acc => (
                                    <tr key={acc.id} className="hover:bg-surface-muted/50 transition-colors">
                                        <td className="px-5 py-3 font-mono text-foreground font-semibold">{acc.code}</td>
                                        <td className="px-5 py-3 font-semibold text-foreground">{acc.name}</td>
                                        <td className="px-5 py-3 capitalize text-muted font-medium">{acc.type}</td>
                                        <td className="px-5 py-3 text-right font-semibold text-foreground">{money(acc.debit_balance)}</td>
                                        <td className="px-5 py-3 text-right font-semibold text-foreground">{money(acc.credit_balance)}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                acc.is_system ? 'bg-surface-hover text-muted' : 'bg-success-soft text-success-ink'
                                            }`}>
                                                {acc.is_system ? 'System' : 'Custom'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                /* nested hierarchy */
                                rootAccounts.map(root => (
                                    <React.Fragment key={root.id}>
                                        {/* Root Account row */}
                                        <tr className="bg-surface-muted/40 font-bold border-t border-line-soft">
                                            <td className="px-5 py-3 text-foreground font-mono">{root.code}</td>
                                            <td className="px-5 py-3 text-foreground">{root.name}</td>
                                            <td className="px-5 py-3 capitalize text-muted font-medium">{root.type}</td>
                                            <td className="px-5 py-3 text-right text-foreground">{money(root.debit_balance)}</td>
                                            <td className="px-5 py-3 text-right text-foreground">{money(root.credit_balance)}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className="text-[10px] bg-surface-hover text-foreground px-2 py-0.5 rounded font-bold uppercase">System</span>
                                            </td>
                                        </tr>
                                        {/* Children of this root */}
                                        {accounts.filter(a => a.parent_id === root.id).map(child => (
                                            <tr key={child.id} className="hover:bg-surface-muted/50 transition-colors">
                                                <td className="px-5 py-3 pl-10 font-mono text-muted font-medium">{child.code}</td>
                                                <td className="px-5 py-3 pl-8 text-foreground font-semibold">{child.name}</td>
                                                <td className="px-5 py-3 capitalize text-muted font-medium">{child.type}</td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-850">{money(child.debit_balance)}</td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-855">{money(child.credit_balance)}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                        child.is_system ? 'bg-surface-hover text-muted' : 'bg-success-soft text-success-ink'
                                                    }`}>
                                                        {child.is_system ? 'System' : 'Custom'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}

                            {isSearching && flatFilteredAccounts.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-subtle font-medium">
                                        No accounts match your search query.
                                    </td>
                                </tr>
                            )}

                            {!isSearching && rootAccounts.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-subtle font-medium">
                                        No accounts found in Chart of Accounts.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
