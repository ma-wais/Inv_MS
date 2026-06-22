import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../Components/FloatingInput';
import SearchableSelect from '../../Components/SearchableSelect';

export default function StaffList({ staff }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);

    const createForm = useForm({
        email: '',
        role: 'cashier',
        name: '',
        password: '',
        image: null,
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
        switch (role) {
            case 'owner':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'manager':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'cashier':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'accountant':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <AuthenticatedLayout title="Staff Management">
            <Head title="Staff Management" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Staff Management</h1>
                        <p className="text-sm text-slate-500">Manage employee accounts, assign system roles, and revoke shop access.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Add Staff Member
                    </button>
                </div>

                {/* Staff Table */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Employee Name</th>
                                    <th>Email</th>
                                    <th className="text-center">Shop Role</th>
                                    <th className="text-right px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {staff.length > 0 ? (
                                    staff.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/20">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    {row.image_url ? (
                                                        <img
                                                            src={row.image_url}
                                                            alt={row.name}
                                                            className="h-8 w-8 rounded-full object-cover border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                                                            {row.name ? row.name.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-slate-800">{row.name}</div>
                                                        <div className="text-xs text-slate-400">ID: {row.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-slate-600 font-mono text-xs">{row.email}</td>
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
                                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                                                    >
                                                        Edit Role
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMember(row)}
                                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
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
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800">Add Staff Member</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
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
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                />
                                <label htmlFor="existing_user_toggle" className="text-xs font-semibold text-slate-700 uppercase select-none cursor-pointer">
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

                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Picture</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => createForm.setData('image', e.target.files[0])}
                                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                                        />
                                        {createForm.errors.image && <p className="text-xs text-red-650 font-medium">{createForm.errors.image}</p>}
                                    </div>
                                </>
                            )}

                            <SearchableSelect
                                label="Shop Role"
                                value={createForm.data.role}
                                onChange={e => createForm.setData('role', e.target.value)}
                                options={[
                                    { value: 'manager', label: 'Manager' },
                                    { value: 'cashier', label: 'Cashier' },
                                    { value: 'accountant', label: 'Accountant' },
                                    { value: 'viewer', label: 'Viewer' },
                                    { value: 'owner', label: 'Owner (Full Control)' }
                                ]}
                                required
                                error={createForm.errors.role}
                            />

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
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
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800">Edit Staff Role: {editingMember?.name}</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
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
                                    { value: 'manager', label: 'Manager' },
                                    { value: 'cashier', label: 'Cashier' },
                                    { value: 'accountant', label: 'Accountant' },
                                    { value: 'viewer', label: 'Viewer' },
                                    { value: 'owner', label: 'Owner (Full Control)' }
                                ]}
                                required
                                error={editForm.errors.role}
                            />

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
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
