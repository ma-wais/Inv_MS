import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';

export default function Dashboard({ summary, branches }) {
    const cards = [
        ['Active branches', summary.branches],
        ['Warehouses', summary.warehouses],
        ['Shop users', summary.users],
        ['Accounts', summary.accounts],
    ];

    return (
        <AuthenticatedLayout title="Dashboard">
            <Head title="Dashboard" />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">{label}</p>
                        <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
                    </div>
                ))}
            </section>

            <section className="mt-7 grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold">Operations foundation</h2>
                            <p className="mt-1 text-sm text-slate-500">The next modules will build on this tenant boundary.</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Phase 1
                        </span>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {['Products and variants', 'Stock movement ledger', 'Purchases and suppliers', 'Sales and POS'].map(
                            (module) => (
                                <div key={module} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium">
                                    {module}
                                </div>
                            ),
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="font-semibold">Branches</h2>
                    <div className="mt-4 space-y-3">
                        {branches.map((branch) => (
                            <div key={branch.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium">{branch.name}</p>
                                    <p className="text-xs text-slate-500">{branch.code || 'No code'}</p>
                                </div>
                                {branch.is_default && (
                                    <span className="text-xs font-semibold text-emerald-700">Default</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}
