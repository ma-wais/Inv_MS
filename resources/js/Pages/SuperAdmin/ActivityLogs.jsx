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

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">System Activity Audit Logs</h1>
                        <p className="text-sm text-slate-500">Track and monitor all operations, status changes, and configurations across the platform.</p>
                    </div>
                </div>

                {/* Filter and Search */}
                <form onSubmit={handleSearch} className="flex gap-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <input
                        type="text"
                        placeholder="Search logs by event title, IP address..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                    <button type="submit" className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                        Search
                    </button>
                </form>

                {/* Logs Table */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Event Action</th>
                                    <th>Attribution</th>
                                    <th>Shop/Tenant</th>
                                    <th>IP Address</th>
                                    <th>Timestamp</th>
                                    <th className="text-right px-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.data.length > 0 ? (
                                    logs.data.map((row) => {
                                        const isExpanded = expandedId === row.id;
                                        return (
                                            <React.Fragment key={row.id}>
                                                <tr className="hover:bg-slate-50/20">
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-semibold text-slate-800 text-xs uppercase tracking-wider font-mono">
                                                            {row.event}
                                                        </span>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">Model: {row.auditable_type || 'None'} (#{row.auditable_id || '—'})</p>
                                                    </td>
                                                    <td>
                                                        <div className="text-slate-800 font-semibold">{row.user_name}</div>
                                                        <div className="text-xs text-slate-400 font-mono">{row.user_email}</div>
                                                    </td>
                                                    <td className="text-slate-600 font-medium text-xs">{row.tenant_name}</td>
                                                    <td className="text-slate-500 font-mono text-xs">{row.ip_address}</td>
                                                    <td className="text-slate-500 text-xs">{row.created_at}</td>
                                                    <td className="text-right px-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(row.id)}
                                                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            {isExpanded ? 'Hide Payload' : 'Inspect'}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expanded Payload Section */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="6" className="bg-slate-50/80 px-6 py-4">
                                                            <div className="grid gap-4 sm:grid-cols-2 text-xs">
                                                                <div>
                                                                    <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-2">Previous State (Old Values)</h4>
                                                                    {row.old_values && Object.keys(row.old_values).length > 0 ? (
                                                                        <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto max-h-48 font-mono text-[11px] leading-relaxed">
                                                                            {JSON.stringify(row.old_values, null, 2)}
                                                                        </pre>
                                                                    ) : (
                                                                        <p className="text-slate-400 italic">No previous state recorded (Creation / Null event).</p>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-2">New State (New Values)</h4>
                                                                    {row.new_values && Object.keys(row.new_values).length > 0 ? (
                                                                        <pre className="p-3 bg-slate-900 text-purple-300 rounded-lg overflow-x-auto max-h-48 font-mono text-[11px] leading-relaxed">
                                                                            {JSON.stringify(row.new_values, null, 2)}
                                                                        </pre>
                                                                    ) : (
                                                                        <p className="text-slate-400 italic">No modified state recorded (Deletion / Null event).</p>
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
                                        <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                            No system activity logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.links && logs.links.length > 3 && (
                        <div className="flex flex-wrap gap-1 border-t border-slate-100 mt-4 pt-4">
                            {logs.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                        link.active ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
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
