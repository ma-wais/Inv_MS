import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function ActivityLogs({ logs, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [expandedId, setExpandedId] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/super-admin/activity-logs', { search }, { preserveState: true });
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <AuthenticatedLayout title="System Activity Logs">
            <Head title="System Activity Logs" />

            <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">System Activity Audit Logs</h1>
                        <p className="text-sm text-muted">Track and monitor all operations, status changes, and configurations across the platform.</p>
                    </div>
                </div>

                {/* Filter and Search */}
                <form onSubmit={handleSearch} className="flex gap-2 bg-surface p-4 rounded-xl border border-line shadow-xs">
                    <input
                        type="text"
                        placeholder="Search logs by event title, IP address..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 rounded-lg border border-line bg-surface-muted px-4 py-2 text-sm focus:border-emerald-500 focus:bg-surface focus:outline-hidden"
                    />
                    <button type="submit" className="rounded-lg bg-action px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                        Search
                    </button>
                </form>

                {/* Logs Table */}
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase text-muted">
                                <tr>
                                    <th className="px-4 py-3">Event Action</th>
                                    <th>Attribution</th>
                                    <th>Shop/Tenant</th>
                                    <th>IP Address</th>
                                    <th>Timestamp</th>
                                    <th className="text-right px-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft">
                                {logs.data.length > 0 ? (
                                    logs.data.map((row) => {
                                        const isExpanded = expandedId === row.id;
                                        return (
                                            <React.Fragment key={row.id}>
                                                <tr className="hover:bg-surface-muted/20">
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-semibold text-foreground text-xs uppercase tracking-wider font-mono">
                                                            {row.event}
                                                        </span>
                                                        <p className="text-[10px] text-subtle mt-0.5">Model: {row.auditable_type || 'None'} (#{row.auditable_id || '—'})</p>
                                                    </td>
                                                    <td>
                                                        <div className="text-foreground font-semibold">{row.user_name}</div>
                                                        <div className="text-xs text-subtle font-mono">{row.user_email}</div>
                                                    </td>
                                                    <td className="text-muted font-medium text-xs">{row.tenant_name}</td>
                                                    <td className="text-muted font-mono text-xs">{row.ip_address}</td>
                                                    <td className="text-muted text-xs">{row.created_at}</td>
                                                    <td className="text-right px-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(row.id)}
                                                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border border-line bg-surface text-foreground hover:bg-surface-muted transition-colors"
                                                        >
                                                            {isExpanded ? 'Hide Payload' : 'Inspect'}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expanded Payload Section */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="6" className="bg-surface-muted/80 px-6 py-4">
                                                            <div className="grid gap-4 sm:grid-cols-2 text-xs">
                                                                <div>
                                                                    <h4 className="font-bold text-muted uppercase tracking-wider mb-2">Previous State (Old Values)</h4>
                                                                    {row.old_values && Object.keys(row.old_values).length > 0 ? (
                                                                        <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto max-h-48 font-mono text-[11px] leading-relaxed">
                                                                            {JSON.stringify(row.old_values, null, 2)}
                                                                        </pre>
                                                                    ) : (
                                                                        <p className="text-subtle italic">No previous state recorded (Creation / Null event).</p>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-muted uppercase tracking-wider mb-2">New State (New Values)</h4>
                                                                    {row.new_values && Object.keys(row.new_values).length > 0 ? (
                                                                        <pre className="p-3 bg-slate-900 text-purple-300 rounded-lg overflow-x-auto max-h-48 font-mono text-[11px] leading-relaxed">
                                                                            {JSON.stringify(row.new_values, null, 2)}
                                                                        </pre>
                                                                    ) : (
                                                                        <p className="text-subtle italic">No modified state recorded (Deletion / Null event).</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-muted">
                                            No system activity logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.links && logs.links.length > 3 && (
                        <div className="flex flex-wrap gap-1 border-t border-line-soft mt-4 pt-4">
                            {logs.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                        link.active ? 'bg-action text-white' : 'bg-surface-hover text-muted'
                                    } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
