import React from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function Backups({ backups, maintenance }) {
    const { flash, errors } = usePage().props;
    const createForm = useForm({});
    const deleteForm = useForm({});

    const handleCreateBackup = (e) => {
        e.preventDefault();
        createForm.post('/super-admin/backups', {
            preserveScroll: true
        });
    };

    const handleDeleteBackup = (filename) => {
        if (confirm(`Are you sure you want to permanently delete the backup file "${filename}"?`)) {
            router.delete(`/super-admin/backups/${filename}`);
        }
    };

    return (
        <AuthenticatedLayout title="Database Backups">
            <Head title="System Backups" />

            <div className="w-full space-y-6">
                {flash.status && <p role="status" className="rounded-xl bg-success-soft p-4 text-sm text-success-ink">{flash.status}</p>}
                {errors.backup && <p role="alert" className="rounded-xl bg-danger-soft p-4 text-sm text-danger-ink">{errors.backup}</p>}
                <div className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">Scheduled daily at <strong className="text-foreground">{maintenance.time} {maintenance.timezone}</strong>. Completed archives older than {maintenance.retention_days} days are removed after a successful scheduled backup. A server cron job must run the scheduler; timestamps below are UTC.</div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground font-sans">Full System database backups</h1>
                        <p className="text-sm text-muted">Generate, download, and manage compressed full SQL database dumps across all tenant environments.</p>
                    </div>
                    <form onSubmit={handleCreateBackup}>
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-action px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-60"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {createForm.processing ? 'Generating SQL dump...' : 'Generate full SQL backup'}
                        </button>
                    </form>
                </div>

                {/* Backups Table */}
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase text-muted">
                                <tr>
                                    <th className="px-4 py-3">File Name</th>
                                    <th>File Size</th>
                                    <th>Created At</th>
                                    <th className="text-right px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft">
                                {backups.length > 0 ? (
                                    backups.map((row) => (
                                        <tr key={row.filename} className="hover:bg-surface-muted/20">
                                            <td className="px-4 py-3.5 font-semibold text-foreground font-mono text-xs">{row.filename}</td>
                                            <td className="text-muted font-medium">{row.size}</td>
                                            <td className="text-muted text-xs">{row.created_at}</td>
                                            <td className="text-right px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a
                                                        href={`/super-admin/backups/${row.filename}`}
                                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border border-line bg-surface text-foreground hover:bg-surface-muted transition-colors"
                                                    >
                                                        Download
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteBackup(row.filename)}
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
                                        <td colSpan="4" className="px-4 py-8 text-center text-muted">
                                            No system database backups found. Click "Generate full SQL backup" above to create one.
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
