import { Link, router, usePage } from '@inertiajs/react';

const navigation = [
    { label: 'Dashboard', href: '/dashboard', active: true },
    { label: 'Products', href: '/products' },
    { label: 'Inventory setup', href: '/inventory/setup' },
    { label: 'Stock ledger', href: '/stock' },
    { label: 'Suppliers', href: '/suppliers' },
    { label: 'Purchases', href: '/purchases' },
    { label: 'Sales / POS', href: '#', soon: true },
    { label: 'Accounting', href: '#', soon: true },
    { label: 'Reports', href: '#', soon: true },
    { label: 'Shop settings', href: '/settings/shop' },
];

export default function AuthenticatedLayout({ title, children }) {
    const { auth } = usePage().props;

    function switchTenant(event) {
        router.post(`/shops/${event.target.value}/select`);
    }

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <aside className="fixed inset-y-0 left-0 hidden w-64 bg-slate-950 px-5 py-6 text-white lg:block">
                <Link href="/dashboard" className="text-xl font-bold tracking-tight text-emerald-300">
                    Ventory
                </Link>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">Shop operations</p>

                <nav className="mt-10 space-y-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
                                item.active
                                    ? 'bg-emerald-400/15 font-semibold text-emerald-200'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            {item.label}
                            {item.soon && <span className="text-[10px] uppercase tracking-wider text-slate-600">Soon</span>}
                        </Link>
                    ))}
                </nav>
            </aside>

            <div className="lg:pl-64">
                <header className="border-b border-slate-200 bg-white">
                    <div className="flex min-h-16 items-center justify-between gap-4 px-5 lg:px-8">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                                {auth.role ?? 'Member'}
                            </p>
                            <h1 className="font-semibold">{title}</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={auth.tenant?.id ?? ''}
                                onChange={switchTenant}
                                className="max-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                                {auth.tenants.map((tenant) => (
                                    <option key={tenant.id} value={tenant.id}>
                                        {tenant.name}
                                    </option>
                                ))}
                            </select>
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-medium">{auth.user.name}</p>
                                <p className="text-xs text-slate-500">{auth.user.email}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-5 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
