import { Head, Link, usePage, router } from '@inertiajs/react';

export default function Select({ tenants }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.is_super_admin;

    return (
        <>
            <Head title="Select shop" />
            <main className="min-h-screen bg-action px-6 py-16 text-white">
                <section className="mx-auto max-w-4xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-foreground font-black text-xs">
                                IMS
                            </div>
                            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Inventory Management System</span>
                        </div>
                        {isSuperAdmin && (
                            <Link
                                href="/super-admin/tenants"
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            >
                                System Admin Dashboard &rarr;
                            </Link>
                        )}
                    </div>
                    <h1 className="mt-3 text-4xl font-bold tracking-tight">Choose a shop</h1>
                    <p className="mt-2 text-subtle">
                        {isSuperAdmin
                            ? 'Select a shop to inspect or manage, or head to the System Admin panel.'
                            : 'Only shops assigned to your user account appear here.'}
                    </p>

                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                        {tenants.map((tenant) => (
                            <button
                                key={tenant.id}
                                type="button"
                                onClick={() => router.post(`/shops/${tenant.id}/select`)}
                                className="rounded-2xl border border-white/10 bg-surface/5 p-6 text-left hover:border-emerald-300/50 hover:bg-emerald-300/10 cursor-pointer transition-all"
                            >
                                <p className="text-lg font-semibold">{tenant.name}</p>
                                <p className="mt-1 text-sm text-subtle">
                                    {tenant.slug} · {tenant.currency}
                                </p>
                            </button>
                        ))}
                    </div>

                    {tenants.length === 0 && (
                        <div className="mt-10 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100 flex items-center justify-between">
                            <span>Your account is not assigned to an active shop yet.</span>
                            {isSuperAdmin && (
                                <Link
                                    href="/super-admin/tenants"
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-400 text-foreground font-bold hover:bg-amber-300"
                                >
                                    Go to Super Admin
                                </Link>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
