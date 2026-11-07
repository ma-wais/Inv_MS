import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../Components/FloatingInput';
import SearchableSelect from '../../Components/SearchableSelect';
import PhoneInput from '../../Components/PhoneInput';
import CnicInput from '../../Components/CnicInput';

export default function StaffList({ staff }) {
    const { flash, errors } = usePage().props;
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);

    const createForm = useForm({
        email: '',
        role: 'worker',
        name: '',
        password: '',
        image: null,
        phone: '',
        cnic: '',
        existing_user: false,
    });

    const editForm = useForm({
        role: '',
    });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post('/settings/staff', {
            onSuccess: () => {
                createForm.reset();
                setShowCreateModal(false);
            }
        });
    };

    const openEdit = (member) => {
        setEditingMember(member);
        editForm.setData({
            role: member.role,
        });
        setShowEditModal(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/settings/staff/${editingMember.id}`, {
            onSuccess: () => {
                editForm.reset();
                setShowEditModal(false);
            }
        });
    };

    const handleRemoveMember = (member) => {
        if (confirm(`Are you sure you want to remove "${member.name}" from your shop staff?`)) {
            router.delete(`/settings/staff/${member.id}`);
        }
    };

    const getRoleBadge = (role) => {
        return role === 'admin' ? 'bg-info-soft text-purple-800 border-purple-200' : 'bg-success-soft text-success-ink border-success-ink/30';
    };

    return (
        <AuthenticatedLayout title="Staff Management">
            <Head title="Staff Management" />
            {flash.status && <p role="status" className="mb-4 rounded-xl bg-success-soft p-3 text-sm text-success-ink">{flash.status}</p>}
            {!showCreateModal && !showEditModal && Object.entries(errors || {}).map(([field, message]) => <p key={field} role="alert" className="mb-4 rounded-xl bg-danger-soft p-3 text-sm text-danger-ink">{message}</p>)}

            <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Staff Management</h1>
                        <p className="text-sm text-muted">Manage employee accounts, assign system roles, and revoke shop access.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-action px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Add Staff Member
                    </button>
                </div>

                {/* Staff Table */}
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase text-muted">
                                <tr>
                                    <th className="px-4 py-3">Employee Name</th>
                                    <th>Email</th>
                                    <th className="text-center">Shop Role</th>
                                    <th className="text-right px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft">
                                {staff.length > 0 ? (
                                    staff.map((row) => (
                                        <tr key={row.id} className="hover:bg-surface-muted/20">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    {row.image_url ? (
                                                        <img
                                                            src={row.image_url}
                                                            alt={row.name}
                                                            className="h-8 w-8 rounded-full object-cover border border-line"
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-surface-hover flex items-center justify-center font-bold text-foreground text-sm">
                                                            {row.name ? row.name.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-foreground">{row.name}</div>
                                                        <div className="text-xs text-subtle">ID: {row.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-muted font-mono text-xs">{row.email}</td>
                                            <td className="text-center">
                                                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${getRoleBadge(row.role)}`}>
                                                    {row.role}
                                                </span>
                                            </td>
                                            <td className="text-right px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(row)}
                                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border border-line bg-surface text-foreground hover:bg-surface-muted transition-colors"
                                                    >
                                                        Edit Role
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMember(row)}
                                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border border-danger-ink/30 bg-danger-soft text-danger-ink hover:bg-danger-soft transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-muted">
                                            No staff linked to this shop.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* CREATE STAFF MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3">
                            <h3 className="text-base font-bold text-foreground">Add Staff Member</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-subtle hover:text-muted">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submitCreate} className="space-y-4">
                            <div className="flex items-center gap-2 py-1">
                                <input
                                    type="checkbox"
                                    id="existing_user_toggle"
                                    checked={createForm.data.existing_user}
                                    onChange={e => createForm.setData('existing_user', e.target.checked)}
                                    className="rounded border-line text-success-ink focus:ring-emerald-500 h-4 w-4"
                                />
                                <label htmlFor="existing_user_toggle" className="text-xs font-semibold text-foreground uppercase select-none cursor-pointer">
                                    Link Existing Registered User?
                                </label>
                            </div>

                            <FloatingInput
                                label="Email Address"
                                type="email"
                                value={createForm.data.email}
                                onChange={e => createForm.setData('email', e.target.value)}
                                required
                                error={createForm.errors.email}
                            />

                            {!createForm.data.existing_user && (
                                <>
                                    <FloatingInput
                                        label="Full Name"
                                        value={createForm.data.name}
                                        onChange={e => createForm.setData('name', e.target.value)}
                                        required
                                        error={createForm.errors.name}
                                    />

                                    <FloatingInput
                                        label="Temporary Password"
                                        type="password"
                                        value={createForm.data.password}
                                        onChange={e => createForm.setData('password', e.target.value)}
                                        required
                                        error={createForm.errors.password}
                                    />

                                    <PhoneInput value={createForm.data.phone} onChange={e => createForm.setData('phone', e.target.value)} error={createForm.errors.phone} />
                                    <CnicInput value={createForm.data.cnic} onChange={e => createForm.setData('cnic', e.target.value)} error={createForm.errors.cnic} />
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-subtle uppercase tracking-widest">Profile Picture</label>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={e => createForm.setData('image', e.target.files[0])}
                                            className="w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-line file:text-xs file:font-semibold file:bg-surface-muted file:text-foreground hover:file:bg-surface-hover cursor-pointer"
                                        />
                                        {createForm.errors.image && <p className="text-xs text-danger-ink font-medium">{createForm.errors.image}</p>}
                                    </div>
                                </>
                            )}

                            <SearchableSelect
                                label="Shop Role"
                                value={createForm.data.role}
                                onChange={e => createForm.setData('role', e.target.value)}
                                options={[
                                    { value: 'admin', label: 'Admin ? full shop access' },
                                    { value: 'worker', label: 'Worker ? daily operations' }
                                ]}
                                required
                                error={createForm.errors.role}
                            />

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
                                    {createForm.processing ? 'Adding...' : 'Link Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT STAFF MODAL */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3">
                            <h3 className="text-base font-bold text-foreground">Edit Staff Role: {editingMember?.name}</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-subtle hover:text-muted">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submitEdit} className="space-y-4">
                            <SearchableSelect
                                label="Shop Role"
                                value={editForm.data.role}
                                onChange={e => editForm.setData('role', e.target.value)}
                                options={[
                                    { value: 'admin', label: 'Admin ? full shop access' },
                                    { value: 'worker', label: 'Worker ? daily operations' }
                                ]}
                                required
                                error={editForm.errors.role}
                            />

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
