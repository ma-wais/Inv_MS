import { Head, router } from '@inertiajs/react';

export default function Select({ tenants }) {
    return (
        <>
            <Head title="Select shop" />
            <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
                <section className="mx-auto max-w-4xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Ventory</p>
                    <h1 className="mt-3 text-4xl font-bold tracking-tight">Choose a shop</h1>
                    <p className="mt-2 text-slate-400">Only shops assigned to your user account appear here.</p>

                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                        {tenants.map((tenant) => (
                            <button
                                key={tenant.id}
                                type="button"
                                onClick={() => router.post(`/shops/${tenant.id}/select`)}
                                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left hover:border-emerald-300/50 hover:bg-emerald-300/10"
                            >
                                <p className="text-lg font-semibold">{tenant.name}</p>
                                <p className="mt-1 text-sm text-slate-400">
                                    {tenant.slug} · {tenant.currency}
                                </p>
                            </button>
                        ))}
                    </div>

                    {tenants.length === 0 && (
                        <div className="mt-10 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">
                            Your account is not assigned to an active shop yet.
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
