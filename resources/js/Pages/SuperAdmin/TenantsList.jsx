import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import PhoneInput from '../../Components/PhoneInput';

export default function TenantsList({ tenants }) {
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);

    const createForm = useForm({
        name: '',
        slug: '',
        phone: '',
        currency: 'PKR',
        timezone: 'Asia/Karachi',
    });

    const editForm = useForm({
        name: '',
        phone: '',
        currency: 'PKR',
        timezone: 'Asia/Karachi',
    });

    // Auto-slugify shop name during creation
    useEffect(() => {
        const slug = createForm.data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        createForm.setData('slug', slug);
    }, [createForm.data.name]);

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

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post('/super-admin/tenants', {
            onSuccess: () => {
                createForm.reset();
                setShowCreateModal(false);
            }
        });
    };

    const openEdit = (tenant) => {
        setEditingTenant(tenant);
        editForm.setData({
            name: tenant.name,
            phone: tenant.phone === '—' ? '' : tenant.phone,
            currency: tenant.currency,
            timezone: tenant.timezone
        });
        setShowEditModal(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/super-admin/tenants/${editingTenant.id}`, {
            onSuccess: () => {
                editForm.reset();
                setShowEditModal(false);
            }
        });
    };

    return (
        <AuthenticatedLayout title="Super Admin Panel">
            <Head title="Super Admin Panel - Tenants" />

            <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Super Admin - Shop Management</h1>
                        <p className="text-sm text-muted">Monitor all shops, view usage metrics, and suspend or activate access.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-action px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Shop
                    </button>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-line">
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search shops by name, slug, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-line bg-surface-muted pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:bg-surface focus:outline-hidden"
                        />
                    </div>
                </div>

                {/* Tenants Table */}
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase text-muted">
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
                            <tbody className="divide-y divide-line-soft">
                                {filteredTenants.length > 0 ? (
                                    filteredTenants.map((row) => (
                                        <tr key={row.id} className="hover:bg-surface-muted/20">
                                            <td className="px-4 py-3 font-semibold text-foreground">{row.name}</td>
                                            <td className="font-mono text-xs text-muted">{row.slug}</td>
                                            <td className="text-muted">{row.phone}</td>
                                            <td className="text-muted uppercase">{row.currency}</td>
                                            <td className="text-muted text-xs">{row.timezone}</td>
                                            <td className="text-center font-medium text-foreground">{row.users_count}</td>
                                            <td className="text-center font-medium text-foreground">{row.products_count}</td>
                                            <td className="text-center">
                                                {row.status === 'active' ? (
                                                    <span className="inline-block rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-bold text-success-ink">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-block rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-bold text-danger-ink">
                                                        Suspended
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-right px-4 flex items-center justify-end gap-1.5 py-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(row)}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border border-line bg-surface text-foreground hover:bg-surface-muted transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(row.id, row.status)}
                                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs focus:outline-none transition-colors border ${
                                                        row.status === 'active'
                                                            ? 'border-danger-ink/30 bg-danger-soft text-danger-ink hover:bg-danger-soft'
                                                            : 'border-success-ink/30 bg-success-soft text-success-ink hover:bg-success-soft'
                                                    }`}
                                                >
                                                    {row.status === 'active' ? 'Suspend' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-8 text-center text-muted">
                                            No shops registered in the system.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3">
                            <h3 className="text-base font-bold text-foreground">Create New Shop</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-subtle hover:text-muted">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submitCreate} className="space-y-4">
                            <label className="block text-xs font-semibold text-muted uppercase">
                                Shop Name
                                <input
                                    type="text"
                                    value={createForm.data.name}
                                    onChange={e => createForm.setData('name', e.target.value)}
                                    required
                                    className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                />
                                {createForm.errors.name && <p className="mt-1 text-xs text-danger-ink font-normal">{createForm.errors.name}</p>}
                            </label>

                            <label className="block text-xs font-semibold text-muted uppercase">
                                URL Slug
                                <input
                                    type="text"
                                    value={createForm.data.slug}
                                    onChange={e => createForm.setData('slug', e.target.value)}
                                    required
                                    className="mt-1.5 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-emerald-500 font-normal"
                                />
                                {createForm.errors.slug && <p className="mt-1 text-xs text-danger-ink font-normal">{createForm.errors.slug}</p>}
                            </label>

                            <div className="flex flex-col gap-1">
                                <PhoneInput
                                    name="phone"
                                    label="Phone Number"
                                    value={createForm.data.phone}
                                    onChange={e => createForm.setData('phone', e.target.value)}
                                    error={createForm.errors.phone}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="block text-xs font-semibold text-muted uppercase">
                                    Currency
                                    <select
                                        value={createForm.data.currency}
                                        onChange={e => createForm.setData('currency', e.target.value)}
                                        className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                    >
                                        <option value="PKR">PKR (Rs.)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </label>

                                <label className="block text-xs font-semibold text-muted uppercase">
                                    Timezone
                                    <select
                                        value={createForm.data.timezone}
                                        onChange={e => createForm.setData('timezone', e.target.value)}
                                        className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                    >
                                        <option value="Asia/Karachi">Asia/Karachi</option>
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">America/New_York</option>
                                    </select>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-line-soft pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-lg border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="rounded-lg bg-action px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                                >
                                    {createForm.processing ? 'Creating...' : 'Create & Initialize'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3">
                            <h3 className="text-base font-bold text-foreground">Edit Shop: {editingTenant?.name}</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-subtle hover:text-muted">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submitEdit} className="space-y-4">
                            <label className="block text-xs font-semibold text-muted uppercase">
                                Shop Name
                                <input
                                    type="text"
                                    value={editForm.data.name}
                                    onChange={e => editForm.setData('name', e.target.value)}
                                    required
                                    className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                />
                                {editForm.errors.name && <p className="mt-1 text-xs text-danger-ink font-normal">{editForm.errors.name}</p>}
                            </label>

                            <div className="flex flex-col gap-1">
                                <PhoneInput
                                    name="phone"
                                    label="Phone Number"
                                    value={editForm.data.phone}
                                    onChange={e => editForm.setData('phone', e.target.value)}
                                    error={editForm.errors.phone}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="block text-xs font-semibold text-muted uppercase">
                                    Currency
                                    <select
                                        value={editForm.data.currency}
                                        onChange={e => editForm.setData('currency', e.target.value)}
                                        className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                    >
                                        <option value="PKR">PKR (Rs.)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </label>

                                <label className="block text-xs font-semibold text-muted uppercase">
                                    Timezone
                                    <select
                                        value={editForm.data.timezone}
                                        onChange={e => editForm.setData('timezone', e.target.value)}
                                        className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                    >
                                        <option value="Asia/Karachi">Asia/Karachi</option>
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">America/New_York</option>
                                    </select>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-line-soft pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="rounded-lg border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded-lg bg-action px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                                >
                                    {editForm.processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
