import { Head, useForm, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React from 'react';
import FloatingInput from '../../../Components/FloatingInput';
import SearchableSelect from '../../../Components/SearchableSelect';

export default function Create({ accounts }) {
    const { flash } = usePage().props;
    const form = useForm({
        parent_id: '',
        code: '',
        name: '',
        type: 'asset',
        normal_balance: 'debit',
        description: '',
    });

    function submit(event) {
        event.preventDefault();
        form.post('/accounts', {
            preserveScroll: true,
            onSuccess: () => form.reset()
        });
    }

    const parentOptions = accounts.map(acc => ({
        value: acc.id,
        label: `${acc.code} - ${acc.name}`
    }));

    const typeOptions = [
        { value: 'asset', label: 'Asset' },
        { value: 'liability', label: 'Liability' },
        { value: 'equity', label: 'Equity' },
        { value: 'income', label: 'Income' },
        { value: 'expense', label: 'Expense' }
    ];

    const balanceOptions = [
        { value: 'debit', label: 'Debit' },
        { value: 'credit', label: 'Credit' }
    ];

    return (
        <AuthenticatedLayout title="Add Account">
            <Head title="Add Account" />

            <div className="mx-auto max-w-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-foreground">Create New Account</h1>
                    <Link
                        href="/accounts"
                        className="rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors"
                    >
                        Back to Chart of Accounts
                    </Link>
                </div>

                {flash.status && (
                    <div className="mb-5 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">
                        {flash.status}
                    </div>
                )}

                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-5">
                        <SearchableSelect
                            id="parent_id"
                            name="parent_id"
                            label="Parent Account (Optional)"
                            options={parentOptions}
                            value={form.data.parent_id}
                            onChange={(e) => form.setData('parent_id', e.target.value)}
                            empty="No Parent (Root Category)"
                            error={form.errors.parent_id}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FloatingInput
                                id="code"
                                name="code"
                                label="Account Code"
                                required
                                value={form.data.code}
                                onChange={(e) => form.setData('code', e.target.value)}
                                error={form.errors.code}
                                placeholder="e.g. 1100"
                            />

                            <FloatingInput
                                id="name"
                                name="name"
                                label="Account Name"
                                required
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                error={form.errors.name}
                                placeholder="e.g. Cash on Hand"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <SearchableSelect
                                id="type"
                                name="type"
                                label="Account Type"
                                required
                                options={typeOptions}
                                value={form.data.type}
                                onChange={(e) => form.setData('type', e.target.value)}
                                error={form.errors.type}
                            />

                            <SearchableSelect
                                id="normal_balance"
                                name="normal_balance"
                                label="Normal Balance"
                                required
                                options={balanceOptions}
                                value={form.data.normal_balance}
                                onChange={(e) => form.setData('normal_balance', e.target.value)}
                                error={form.errors.normal_balance}
                            />
                        </div>

                        <div className="relative w-full">
                            <textarea
                                id="description"
                                name="description"
                                value={form.data.description ?? ''}
                                onChange={(e) => form.setData('description', e.target.value)}
                                placeholder=" "
                                className="peer block w-full rounded-xl border border-line bg-surface px-4 pb-2.5 pt-5 text-sm text-foreground outline-none transition-all focus:border-emerald-500 min-h-[80px]"
                            />
                            <label
                                htmlFor="description"
                                className="absolute left-4 top-2 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-xs text-subtle duration-150 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
                            >
                                Description
                            </label>
                            {form.errors.description && <p className="mt-1 text-xs text-danger-ink font-normal">{form.errors.description}</p>}
                        </div>

                        <button
                            disabled={form.processing}
                            className="w-full rounded-xl bg-action px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-900 disabled:opacity-60"
                        >
                            {form.processing ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
