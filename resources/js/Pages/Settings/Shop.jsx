import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function Shop({ shop }) {
    const { flash } = usePage().props;
    const form = useForm(shop);

    function submit(event) {
        event.preventDefault();
        form.put('/settings/shop', { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout title="Shop settings">
            <Head title="Shop settings" />

            <form onSubmit={submit} className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold">Business details</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        These settings belong only to the currently selected shop.
                    </p>
                </div>

                {flash.status && (
                    <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        {flash.status}
                    </div>
                )}

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="Display name" error={form.errors.name}>
                        <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Legal name" error={form.errors.legal_name}>
                        <input value={form.data.legal_name ?? ''} onChange={(e) => form.setData('legal_name', e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Email" error={form.errors.email}>
                        <input type="email" value={form.data.email ?? ''} onChange={(e) => form.setData('email', e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Phone" error={form.errors.phone}>
                        <input value={form.data.phone ?? ''} onChange={(e) => form.setData('phone', e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Currency" error={form.errors.currency}>
                        <input value={form.data.currency} onChange={(e) => form.setData('currency', e.target.value.toUpperCase())} maxLength={3} className={inputClass} />
                    </Field>
                    <Field label="Timezone" error={form.errors.timezone}>
                        <input value={form.data.timezone} onChange={(e) => form.setData('timezone', e.target.value)} className={inputClass} />
                    </Field>
                </div>

                <button
                    type="submit"
                    disabled={form.processing}
                    className="mt-7 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                    {form.processing ? 'Saving...' : 'Save settings'}
                </button>
            </form>
        </AuthenticatedLayout>
    );
}

const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500';

function Field({ label, error, children }) {
    return (
        <label className="block text-sm font-medium">
            {label}
            {children}
            {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
        </label>
    );
}
