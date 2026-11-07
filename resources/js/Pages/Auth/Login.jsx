import { Head, Link, useForm } from '@inertiajs/react';

export default function Login() {
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(event) {
        event.preventDefault();
        form.post('/login', {
            onFinish: () => form.reset('password'),
        });
    }

    return (
        <>
            <Head title="Sign In - Inventory Management System" />
            <main className="grid min-h-screen bg-slate-950 lg:grid-cols-12 selection:bg-emerald-500 selection:text-white">
                {/* Left Visual Branding Panel (7 Cols) */}
                <section className="relative hidden flex-col justify-between p-12 lg:flex lg:col-span-7 xl:col-span-8 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 overflow-hidden border-r border-slate-800/60">
                    {/* Ambient Glow Effects */}
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center text-foreground font-black text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                                IMS
                            </div>
                            <div>
                                <span className="text-xl font-bold tracking-tight text-white block">Inventory Management System</span>
                                <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-semibold">Enterprise Edition</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            System Online
                        </div>
                    </div>

                    <div className="relative z-10 my-auto py-12">
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">Multi-Tenant Business Operations</p>
                        <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white lg:text-5xl xl:text-6xl leading-[1.1]">
                            Control your inventory, POS, purchases & accounting in real time.
                        </h1>
                        <p className="mt-5 max-w-xl text-base text-subtle leading-relaxed">
                            Comprehensive shop management platform engineered for stock accuracy, multi-branch control, and automated financial statements.
                        </p>

                        <div className="mt-10 grid gap-4 sm:grid-cols-3 max-w-2xl">
                            <div className="rounded-xl border border-white/5 bg-surface/5 p-4 backdrop-blur-xs">
                                <p className="text-emerald-400 font-semibold text-sm">Automated Ledger</p>
                                <p className="text-xs text-subtle mt-1">Double-entry accounting built in.</p>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-surface/5 p-4 backdrop-blur-xs">
                                <p className="text-emerald-400 font-semibold text-sm">POS Billing</p>
                                <p className="text-xs text-subtle mt-1">Instant checkout with barcode support.</p>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-surface/5 p-4 backdrop-blur-xs">
                                <p className="text-emerald-400 font-semibold text-sm">Stock Tracking</p>
                                <p className="text-xs text-subtle mt-1">Multi-variant & batch alerts.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-xs text-muted border-t border-slate-800/80 pt-6">
                        <span>Inventory Management System &copy; {new Date().getFullYear()}</span>
                        <span>PKR Currency & Localized Formatting Defaults</span>
                    </div>
                </section>

                {/* Right Form Panel (5 Cols) */}
                <section className="flex items-center justify-center bg-surface px-6 py-12 lg:col-span-5 xl:col-span-4 lg:px-12">
                    <div className="w-full max-w-md space-y-8">
                        <div>
                            {/* Mobile Logo Fallback */}
                            <div className="flex items-center gap-2.5 lg:hidden mb-6">
                                <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                                    IMS
                                </div>
                                <span className="font-bold text-foreground text-lg">Inventory Management System</span>
                            </div>

                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-success-ink">Enterprise Authentication</p>
                            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">Sign in to your account</h2>
                            <p className="mt-2 text-sm text-muted">Access your store dashboard and system modules.</p>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={form.data.email}
                                        onChange={(event) => form.setData('email', event.target.value)}
                                        placeholder="admin@example.com"
                                        autoComplete="email"
                                        autoFocus
                                        className="w-full rounded-xl border border-line bg-surface-muted/50 px-4 py-3 text-sm text-foreground placeholder-slate-400 transition-all outline-none focus:border-emerald-500 focus:bg-surface focus:ring-4 focus:ring-emerald-500/10"
                                    />
                                </div>
                                {form.errors.email && <p className="mt-1.5 text-xs font-medium text-danger-ink">{form.errors.email}</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                                        Password
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={form.data.password}
                                        onChange={(event) => form.setData('password', event.target.value)}
                                        placeholder="••••••••••••"
                                        autoComplete="current-password"
                                        className="w-full rounded-xl border border-line bg-surface-muted/50 px-4 py-3 text-sm text-foreground placeholder-slate-400 transition-all outline-none focus:border-emerald-500 focus:bg-surface focus:ring-4 focus:ring-emerald-500/10"
                                    />
                                </div>
                                {form.errors.password && <p className="mt-1.5 text-xs font-medium text-danger-ink">{form.errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2.5 text-xs font-medium text-muted cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={form.data.remember}
                                        onChange={(event) => form.setData('remember', event.target.checked)}
                                        className="h-4 w-4 rounded border-line text-success-ink focus:ring-emerald-500 cursor-pointer"
                                    />
                                    Remember session
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="w-full rounded-xl bg-slate-950 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-slate-950/20 hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {form.processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In to Dashboard'
                                )}
                            </button>
                        </form>
                    </div>
                </section>
            </main>
        </>
    );
}
