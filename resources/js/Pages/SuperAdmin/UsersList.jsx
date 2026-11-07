import SearchableSelect from '../../Components/SearchableSelect';
import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function UsersList({ users, tenants }) {
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [linkingUser, setLinkingUser] = useState(null);

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        is_super_admin: false,
    });

    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        is_super_admin: false,
    });

    const linkForm = useForm({
        tenant_id: '',
        role: 'admin',
    });

    const filteredUsers = users.filter(user => {
        const query = search.toLowerCase();
        const matchesName = user.name?.toLowerCase().includes(query);
        const matchesEmail = user.email?.toLowerCase().includes(query);
        const matchesTenant = user.tenants?.some(t => t.name?.toLowerCase().includes(query));
        return matchesName || matchesEmail || matchesTenant;
    });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post('/super-admin/users', {
            onSuccess: () => {
                createForm.reset();
                setShowCreateModal(false);
            }
        });
    };

    const openEdit = (user) => {
        setEditingUser(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            is_super_admin: !!user.is_super_admin,
        });
        setShowEditModal(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/super-admin/users/${editingUser.id}`, {
            onSuccess: () => {
                editForm.reset();
                setShowEditModal(false);
            }
        });
    };

    const handleDeleteUser = (user) => {
        if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
            router.delete(`/super-admin/users/${user.id}`);
        }
    };

    const openLink = (user) => {
        setLinkingUser(user);
        linkForm.setData({
            tenant_id: tenants[0]?.id || '',
            role: 'admin',
        });
        setShowLinkModal(true);
    };

    const submitLink = (e) => {
        e.preventDefault();
        linkForm.post(`/super-admin/users/${linkingUser.id}/tenants`, {
            onSuccess: () => {
                linkForm.reset();
                setShowLinkModal(false);
            }
        });
    };

    const handleUnlink = (userId, tenantId, tenantName, userName) => {
        if (confirm(`Are you sure you want to unlink user "${userName}" from shop "${tenantName}"?`)) {
            router.delete(`/super-admin/users/${userId}/tenants/${tenantId}`);
        }
    };

    return (
        <AuthenticatedLayout title="Super Admin Panel">
            <Head title="Super Admin Panel - Users" />

            <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Super Admin - User Management</h1>
                        <p className="text-sm text-muted">Create system users, grant super admin privileges, and manage shop role linkages.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-action px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create New User
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
                            placeholder="Search users by name, email, or shop..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-line bg-surface-muted pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:bg-surface focus:outline-hidden"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase text-muted">
                                <tr>
                                    <th className="px-4 py-3">User Details</th>
                                    <th>Email</th>
                                    <th className="text-center">System Role</th>
                                    <th>Linked Shops & Roles</th>
                                    <th className="text-right px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((row) => (
                                        <tr key={row.id} className="hover:bg-surface-muted/20">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-surface-hover flex items-center justify-center font-bold text-foreground text-sm">
                                                        {row.name ? row.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-foreground">{row.name}</div>
                                                        <div className="text-xs text-subtle">ID: {row.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-muted font-mono text-xs">{row.email}</td>
                                            <td className="text-center">
                                                {row.is_super_admin ? (
                                                    <span className="inline-block rounded-full bg-info-soft px-2.5 py-0.5 text-xs font-bold text-purple-800">
                                                        Super Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-block rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-bold text-foreground">
                                                        Standard User
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {row.tenants && row.tenants.length > 0 ? (
                                                        row.tenants.map((t) => (
                                                            <span
                                                                key={t.id}
                                                                className="inline-flex items-center gap-1 rounded bg-surface-hover px-2 py-0.5 text-xs font-medium text-foreground group"
                                                            >
                                                                <span>{t.name}</span>
                                                                <span className="text-subtle">({t.role})</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUnlink(row.id, t.id, t.name, row.name)}
                                                                    className="text-subtle hover:text-danger-ink transition-colors ml-1 cursor-pointer"
                                                                    title={`Unlink from ${t.name}`}
                                                                >
                                                                    &times;
                                                                </button>
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-subtle text-xs italic">No shops linked</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => openLink(row)}
                                                        className="inline-flex items-center gap-0.5 rounded border border-dashed border-line px-2 py-0.5 text-xs font-medium text-muted hover:border-emerald-500 hover:text-success-ink transition-colors cursor-pointer"
                                                    >
                                                        + Link Shop
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="text-right px-4 py-2.5">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(row)}
                                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border border-line bg-surface text-foreground hover:bg-surface-muted transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteUser(row)}
                                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border border-danger-ink/30 bg-danger-soft text-danger-ink hover:bg-danger-soft transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-muted">
                                            No users found.
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
                            <h3 className="text-base font-bold text-foreground">Create New User</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-subtle hover:text-muted">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submitCreate} className="space-y-4">
                            <label className="block text-xs font-semibold text-muted uppercase">
                                Full Name
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
                                Email Address
                                <input
                                    type="email"
                                    value={createForm.data.email}
                                    onChange={e => createForm.setData('email', e.target.value)}
                                    required
                                    className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                />
                                {createForm.errors.email && <p className="mt-1 text-xs text-danger-ink font-normal">{createForm.errors.email}</p>}
                            </label>

                            <label className="block text-xs font-semibold text-muted uppercase">
                                Password
                                <input
                                    type="password"
                                    value={createForm.data.password}
                                    onChange={e => createForm.setData('password', e.target.value)}
                                    required
                                    className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                />
                                {createForm.errors.password && <p className="mt-1 text-xs text-danger-ink font-normal">{createForm.errors.password}</p>}
                            </label>

                            <div className="flex items-center gap-2 py-1">
                                <input
                                    type="checkbox"
                                    id="create_is_super_admin"
                                    checked={createForm.data.is_super_admin}
                                    onChange={e => createForm.setData('is_super_admin', e.target.checked)}
                                    className="rounded border-line text-success-ink focus:ring-emerald-500 h-4 w-4"
                                />
                                <label htmlFor="create_is_super_admin" className="text-xs font-semibold text-foreground uppercase select-none cursor-pointer">
                                    Is System Super Admin?
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
                                    {createForm.processing ? 'Creating...' : 'Create User'}
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
                            <h3 className="text-base font-bold text-foreground">Edit User: {editingUser?.name}</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-subtle hover:text-muted">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submitEdit} className="space-y-4">
                            <label className="block text-xs font-semibold text-muted uppercase">
                                Full Name
                                <input
                                    type="text"
                                    value={editForm.data.name}
                                    onChange={e => editForm.setData('name', e.target.value)}
                                    required
                                    className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                />
                                {editForm.errors.name && <p className="mt-1 text-xs text-danger-ink font-normal">{editForm.errors.name}</p>}
                            </label>

                            <label className="block text-xs font-semibold text-muted uppercase">
                                Email Address
                                <input
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={e => editForm.setData('email', e.target.value)}
                                    required
                                    className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                />
                                {editForm.errors.email && <p className="mt-1 text-xs text-danger-ink font-normal">{editForm.errors.email}</p>}
                            </label>

                            <label className="block text-xs font-semibold text-muted uppercase">
                                Password (Leave blank to keep unchanged)
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={editForm.data.password}
                                    onChange={e => editForm.setData('password', e.target.value)}
                                    className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                />
                                {editForm.errors.password && <p className="mt-1 text-xs text-danger-ink font-normal">{editForm.errors.password}</p>}
                            </label>

                            <div className="flex items-center gap-2 py-1">
                                <input
                                    type="checkbox"
                                    id="edit_is_super_admin"
                                    checked={editForm.data.is_super_admin}
                                    onChange={e => editForm.setData('is_super_admin', e.target.checked)}
                                    className="rounded border-line text-success-ink focus:ring-emerald-500 h-4 w-4"
                                />
                                <label htmlFor="edit_is_super_admin" className="text-xs font-semibold text-foreground uppercase select-none cursor-pointer">
                                    Is System Super Admin?
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

            {/* LINK SHOP MODAL */}
            {showLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3">
                            <h3 className="text-base font-bold text-foreground">Link User to Shop</h3>
                            <button onClick={() => setShowLinkModal(false)} className="text-subtle hover:text-muted">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submitLink} className="space-y-4">
                            <div className="bg-surface-muted p-3 rounded-lg text-muted text-xs space-y-1">
                                <div><span className="font-semibold">User:</span> {linkingUser?.name}</div>
                                <div><span className="font-semibold">Email:</span> {linkingUser?.email}</div>
                            </div>

                            <SearchableSelect label="Select Shop" value={linkForm.data.tenant_id} onChange={e => linkForm.setData('tenant_id', e.target.value)} options={(tenants || []).map(tenant => [tenant.id, tenant.name])} empty="Select a shop" required error={linkForm.errors.tenant_id} />

                            <label className="block text-xs font-semibold text-muted uppercase">
                                Role in Shop
                                <select
                                    value={linkForm.data.role}
                                    onChange={e => linkForm.setData('role', e.target.value)}
                                    required
                                    className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 font-normal"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="worker">Worker</option>
                                </select>
                                {linkForm.errors.role && <p className="mt-1 text-xs text-danger-ink font-normal">{linkForm.errors.role}</p>}
                            </label>

                            <div className="flex justify-end gap-2 border-t border-line-soft pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowLinkModal(false)}
                                    className="rounded-lg border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={linkForm.processing || !linkForm.data.tenant_id}
                                    className="rounded-lg bg-action px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                                >
                                    {linkForm.processing ? 'Linking...' : 'Link User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
