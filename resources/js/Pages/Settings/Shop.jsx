import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../Components/FloatingInput';
import PhoneInput from '../../Components/PhoneInput';
import ShopAvatar from '../../Components/ShopAvatar';
import { useEffect, useState } from 'react';

export default function Shop({ shop }) {
    const { flash } = usePage().props;
    const form = useForm({ ...shop, logo: null, remove_logo: false });
    const [preview, setPreview] = useState(null);
    useEffect(() => {
        if (!form.data.logo) { setPreview(null); return; }
        const url = URL.createObjectURL(form.data.logo);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [form.data.logo]);

    function submit(event) {
        event.preventDefault();
        form.transform(data => ({ ...data, _method: 'PUT' }));
        form.post('/settings/shop', { preserveScroll: true, forceFormData: true,
            onSuccess: () => { form.setData('logo', null); form.setData('remove_logo', false); },
        });
    }

    return (
        <AuthenticatedLayout title="Shop settings">
            <Head title="Shop settings" />

            <div className="max-w-3xl space-y-6">
                <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                    <div>
                        <h2 className="text-base font-bold text-foreground">Business Details</h2>
                        <p className="mt-1 text-xs text-muted">
                            These settings belong only to the currently selected shop.
                        </p>
                    </div>

                    {flash.status && (
                        <div className="mt-4 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">
                            {flash.status}
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface-muted p-4">
                        <ShopAvatar name={form.data.name} logo={preview || (!form.data.remove_logo ? shop.logo_url : null)} className="h-20 w-20" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <label className="block text-sm font-semibold" htmlFor="shop-logo">Shop logo</label>
                            <input id="shop-logo" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-hover file:px-3 file:py-2 file:text-foreground" onChange={event => { form.setData('logo', event.target.files[0] || null); form.setData('remove_logo', false); }} />
                            <p className="text-xs text-muted">JPG, PNG or WebP, up to 2 MB. Your shop initials appear when no logo is set.</p>
                            {form.errors.logo && <p role="alert" className="text-sm text-danger-ink">{form.errors.logo}</p>}
                            {(shop.logo_url || preview) && <button type="button" className="text-xs font-semibold text-danger-ink" onClick={() => { form.setData('logo', null); form.setData('remove_logo', true); document.getElementById('shop-logo').value = ''; }}>Remove logo</button>}
                        </div>
                    </div>
                    {form.progress && <p className="mt-3 text-sm text-muted" role="status">Uploading: {form.progress.percentage}%</p>}

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <FloatingInput
                            label="Display Name"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            required
                            error={form.errors.name}
                        />
                        <FloatingInput
                            label="Legal Name"
                            value={form.data.legal_name}
                            onChange={(e) => form.setData('legal_name', e.target.value)}
                            error={form.errors.legal_name}
                        />
                        <FloatingInput
                            label="Email Address"
                            type="email"
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                            error={form.errors.email}
                        />
                        <PhoneInput
                            label="Phone Number"
                            name="phone"
                            value={form.data.phone}
                            onChange={(e) => form.setData('phone', e.target.value)}
                            error={form.errors.phone}
                        />
                        <FloatingInput
                            label="Currency Code"
                            value={form.data.currency}
                            onChange={(e) => form.setData('currency', e.target.value.toUpperCase())}
                            maxLength={3}
                            required
                            error={form.errors.currency}
                        />
                        <FloatingInput
                            label="Timezone"
                            value={form.data.timezone}
                            onChange={(e) => form.setData('timezone', e.target.value)}
                            required
                            error={form.errors.timezone}
                        />
                    </div>

                    <div className="mt-6 border-t border-line-soft pt-6">
                        <h3 className="text-sm font-bold text-foreground">Sidebar Reports Configuration</h3>
                        <p className="text-xs text-muted mt-1">Select which operational reports should be visible in the navigation menu.</p>
                        
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {[
                                { key: 'valuation', label: 'Inventory Valuation Report' },
                                { key: 'profit', label: 'Product Profitability Report' },
                                { key: 'expiry', label: 'Batch Expiry & Alerts Report' },
                                { key: 'receivables_payables', label: 'Receivables & Payables Report' },
                            ].map((report) => {
                                const isChecked = (form.data.enabled_reports ?? []).includes(report.key);
                                return (
                                    <label key={report.key} className="flex items-center gap-3 rounded-xl border border-line p-4 hover:bg-surface-muted/50 cursor-pointer transition-colors select-none">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {
                                                const current = form.data.enabled_reports ?? [];
                                                if (current.includes(report.key)) {
                                                    form.setData('enabled_reports', current.filter(k => k !== report.key));
                                                } else {
                                                    form.setData('enabled_reports', [...current, report.key]);
                                                }
                                            }}
                                            className="h-4 w-4 rounded-sm border-line text-success-ink focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{report.label}</p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-start">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-xl bg-action px-5 py-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer"
                        >
                            {form.processing ? 'Saving...' : 'Save settings'}
                        </button>
                    </div>
                </form>

                {/* Backups & Data Export card */}
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm max-w-3xl">
                    <h2 className="text-base font-bold text-foreground">Backup & Export Shop Data</h2>
                    <p className="mt-1 text-xs text-muted">
                        Export all your business information, including product catalogs, sales ledger entries, accounting profiles, and supplier logs as a compressed ZIP file of CSV tables.
                    </p>
                    <div className="mt-4">
                        <a
                            href="/settings/backup"
                            target="_blank"
                            download
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Tenant Backup (ZIP)
                        </a>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
