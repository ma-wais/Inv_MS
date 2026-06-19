import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function TenantsList({ tenants }) {
    const [search, setSearch] = useState('');

    const filteredTenants = tenants.filter(tenant => {
        const query = search.toLowerCase();
        return (
            tenant.name?.toLowerCase().includes(query) ||
            tenant.slug?.toLowerCase().includes(query) ||
            tenant.phone?.toLowerCase().includes(query)
        );
    });

    const handleToggleStatus = (tenantId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        if (confirm(`Are you sure you want to change this shop's status to ${newStatus}?`)) {
            router.post(`/super-admin/tenants/${tenantId}/toggle-status`, {
                status: newStatus
            });
        }
    };

    return (
        <AuthenticatedLayout title="Super Admin Panel">
            <Head title="Super Admin Panel - Tenants" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Super Admin - Shop Management</h1>
                    <p className="text-sm text-slate-500">Monitor all shops, view usage metrics, and suspend or activate access.</p>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search shops by name, slug, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                        />
                    </div>
                </div>

                {/* Tenants Table */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Shop Name</th>
                                    <th>Slug</th>
                                    <th>Phone</th>
                                    <th>Currency</th>
                                    <th>Timezone</th>
                                    <th className="text-center">Users</th>
                                    <th className="text-center">Products</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-right px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTenants.length > 0 ? (
                                    filteredTenants.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/20">
                                            <td className="px-4 py-3 font-semibold text-slate-800">{row.name}</td>
                                            <td className="font-mono text-xs text-slate-600">{row.slug}</td>
                                            <td className="text-slate-600">{row.phone}</td>
                                            <td className="text-slate-500 uppercase">{row.currency}</td>
                                            <td className="text-slate-500 text-xs">{row.timezone}</td>
                                            <td className="text-center font-medium text-slate-800">{row.users_count}</td>
                                            <td className="text-center font-medium text-slate-800">{row.products_count}</td>
                                            <td className="text-center">
                                                {row.status === 'active' ? (
                                                    <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                                                        Suspended
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-right px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(row.id, row.status)}
                                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs focus:outline-none transition-colors border ${
                                                        row.status === 'active'
                                                            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                    }`}
                                                >
                                                    {row.status === 'active' ? 'Suspend' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                                            No shops registered in the system.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
