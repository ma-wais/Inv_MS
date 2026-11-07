import { Head, Link } from '@inertiajs/react';

export default function Welcome({ appName }) {
    return (
        <>
            <Head title="Inventory management" />
            <main className="min-h-screen bg-action text-white">
                <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
                <div className="mb-16 flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">{appName}</p>
                    <Link href="/login" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-surface/10">
                        Sign in
                    </Link>
                </div>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
                    Built for retail operations
                </p>
                <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
                    Inventory, sales, purchasing, and accounts for real shops.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                    Ventory is being built as a tenant-ready Laravel and React system for paint stores,
                    pharmacies, superstores, and general retail. One account ledger, one stock ledger,
                    and clean shop separation from the start.
                </p>
                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                    <Feature title="Tenant-ready" text="Each shop gets isolated data through tenant-scoped records." />
                    <Feature title="Single accounts table" text="No chart/account split; all ledgers point to accounts." />
                    <Feature title="POS-ready" text="Barcode scanners work as keyboard input, with receipt layouts planned." />
                </div>
                </section>
            </main>
        </>
    );
}

function Feature({ title, text }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-surface/5 p-5 shadow-2xl shadow-black/20">
            <h2 className="font-semibold text-emerald-200">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
        </div>
    );
}
