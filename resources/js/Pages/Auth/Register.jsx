import { Head, Link, useForm } from '@inertiajs/react';
import React, { useEffect } from 'react';
import PhoneInput from '@/Components/PhoneInput';

export default function Register() {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        shop_name: '',
        shop_slug: '',
        phone: '',
        currency: 'PKR',
        timezone: 'Asia/Karachi',
    });

    // Helper to auto-slugify shop name
    useEffect(() => {
        const slug = form.data.shop_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        form.setData('shop_slug', slug);
    }, [form.data.shop_name]);

    function submit(event) {
        event.preventDefault();
        form.post('/register', {
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    }

    return (
        <>
            <Head title="Register Shop" />
            <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
                <section className="hidden flex-col justify-between p-12 text-white lg:flex">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-foreground font-black text-xs">
                            IMS
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Inventory Management System</span>
                    </Link>
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Onboarding Flow</p>
                        <h1 className="mt-4 max-w-xl text-5xl font-bold tracking-tight">
                            Start managing your store assets, sales, and accounts in seconds.
                        </h1>
                    </div>
                    <p className="text-sm text-muted">English-first with PKR and Pakistan timezone defaults.</p>
                </section>

                <section className="flex items-center justify-center bg-surface px-6 py-12 overflow-y-auto">
                    <form onSubmit={submit} className="w-full max-w-lg my-auto space-y-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-success-ink">Register Shop</p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight">Create your account</h2>
                            <p className="text-sm text-muted">Enter your owner profile and shop configuration parameters.</p>
                        </div>

                        {/* Owner Details */}
                        <div className="border-t border-line-soft pt-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle mb-3">Owner Profile</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="block text-sm font-medium">
                                    Full Name
                                    <input
                                        type="text"
                                        value={form.data.name}
                                        onChange={(event) => form.setData('name', event.target.value)}
                                        required
                                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    />
                                    {form.errors.name && <p className="mt-1 text-xs text-danger-ink">{form.errors.name}</p>}
                                </label>

                                <label className="block text-sm font-medium">
                                    Email Address
                                    <input
                                        type="email"
                                        value={form.data.email}
                                        onChange={(event) => form.setData('email', event.target.value)}
                                        required
                                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    />
                                    {form.errors.email && <p className="mt-1 text-xs text-danger-ink">{form.errors.email}</p>}
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                                <label className="block text-sm font-medium">
                                    Password
                                    <input
                                        type="password"
                                        value={form.data.password}
                                        onChange={(event) => form.setData('password', event.target.value)}
                                        required
                                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    />
                                    {form.errors.password && <p className="mt-1 text-xs text-danger-ink">{form.errors.password}</p>}
                                </label>

                                <label className="block text-sm font-medium">
                                    Confirm Password
                                    <input
                                        type="password"
                                        value={form.data.password_confirmation}
                                        onChange={(event) => form.setData('password_confirmation', event.target.value)}
                                        required
                                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    />
                                    {form.errors.password_confirmation && <p className="mt-1 text-xs text-danger-ink">{form.errors.password_confirmation}</p>}
                                </label>
                            </div>
                        </div>

                        {/* Shop Details */}
                        <div className="border-t border-line-soft pt-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle mb-3">Shop Configuration</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="block text-sm font-medium">
                                    Shop Name
                                    <input
                                        type="text"
                                        value={form.data.shop_name}
                                        onChange={(event) => form.setData('shop_name', event.target.value)}
                                        required
                                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    />
                                    {form.errors.shop_name && <p className="mt-1 text-xs text-danger-ink">{form.errors.shop_name}</p>}
                                </label>

                                <label className="block text-sm font-medium">
                                    URL Slug
                                    <input
                                        type="text"
                                        value={form.data.shop_slug}
                                        onChange={(event) => form.setData('shop_slug', event.target.value)}
                                        required
                                        className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-mono outline-none focus:border-emerald-500"
                                    />
                                    {form.errors.shop_slug && <p className="mt-1 text-xs text-danger-ink">{form.errors.shop_slug}</p>}
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                                <div className="sm:col-span-1 flex flex-col justify-end">
                                    <PhoneInput
                                        id="phone"
                                        name="phone"
                                        label="Phone Number"
                                        value={form.data.phone}
                                        onChange={(event) => form.setData('phone', event.target.value)}
                                        error={form.errors.phone}
                                    />
                                </div>

                                <label className="block text-sm font-medium sm:col-span-1">
                                    Currency
                                    <select
                                        value={form.data.currency}
                                        onChange={(event) => form.setData('currency', event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    >
                                        <option value="PKR">PKR (Rs.)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="SAR">SAR (SR)</option>
                                    </select>
                                    {form.errors.currency && <p className="mt-1 text-xs text-danger-ink">{form.errors.currency}</p>}
                                </label>

                                <label className="block text-sm font-medium sm:col-span-1">
                                    Timezone
                                    <select
                                        value={form.data.timezone}
                                        onChange={(event) => form.setData('timezone', event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    >
                                        <option value="Asia/Karachi">Asia/Karachi</option>
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">America/New_York</option>
                                        <option value="Europe/London">Europe/London</option>
                                        <option value="Asia/Dubai">Asia/Dubai</option>
                                    </select>
                                    {form.errors.timezone && <p className="mt-1 text-xs text-danger-ink">{form.errors.timezone}</p>}
                                </label>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                            >
                                {form.processing ? 'Registering Shop...' : 'Register and Setup Shop'}
                            </button>

                            <p className="mt-4 text-center text-sm text-muted">
                                Already have an account?{' '}
                                <Link href="/login" className="font-semibold text-foreground hover:text-success-ink underline">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </section>
            </main>
        </>
    );
}
