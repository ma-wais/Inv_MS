import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../Components/FloatingInput';
import PhoneInput from '../../Components/PhoneInput';

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

            <div className="max-w-3xl space-y-6">
                <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Business Details</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            These settings belong only to the currently selected shop.
                        </p>
                    </div>

                    {flash.status && (
                        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                            {flash.status}
                        </div>
                    )}

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

                    <div className="mt-6 border-t border-slate-100 pt-6">
                        <h3 className="text-sm font-bold text-slate-800">Sidebar Reports Configuration</h3>
                        <p className="text-xs text-slate-500 mt-1">Select which operational reports should be visible in the navigation menu.</p>
                        
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {[
                                { key: 'valuation', label: 'Inventory Valuation Report' },
                                { key: 'profit', label: 'Product Profitability Report' },
                                { key: 'expiry', label: 'Batch Expiry & Alerts Report' },
                                { key: 'receivables_payables', label: 'Receivables & Payables Report' },
                            ].map((report) => {
                                const isChecked = (form.data.enabled_reports ?? []).includes(report.key);
                                return (
                                    <label key={report.key} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50/50 cursor-pointer transition-colors select-none">
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
                                            className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{report.label}</p>
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
                            className="rounded-xl bg-slate-950 px-5 py-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer"
                        >
                            {form.processing ? 'Saving...' : 'Save settings'}
                        </button>
                    </div>
                </form>

                {/* Backups & Data Export card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-3xl">
                    <h2 className="text-base font-bold text-slate-800">Backup & Export Shop Data</h2>
                    <p className="mt-1 text-xs text-slate-500">
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
