import { Link, router, usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ title, children }) {
    const { auth } = usePage().props;
    const { url } = usePage();

    const navigation = [
        { label: 'Dashboard', href: '/dashboard', active: url === '/dashboard' || url.startsWith('/dashboard/') },
        { label: 'Products', href: '/products', active: url.startsWith('/products') },
        { label: 'Inventory setup', href: '/inventory/setup', active: url.startsWith('/inventory/setup') },
        { label: 'Stock ledger', href: '/stock', active: url.startsWith('/stock') },
        { label: 'Suppliers', href: '/suppliers', active: url.startsWith('/suppliers') },
        { label: 'Purchases', href: '/purchases', active: url.startsWith('/purchases') },
        { label: 'Customers', href: '/customers', active: url.startsWith('/customers') },
        { label: 'Sales Invoices', href: '/sales', active: url.startsWith('/sales') },
        { label: 'POS Billing', href: '/pos', active: url.startsWith('/pos') },
        { label: 'Chart of Accounts', href: '/accounts', active: url.startsWith('/accounts') },
        { label: 'Journal Entries', href: '/journals', active: url.startsWith('/journals') },
        { label: 'Expenses', href: '/expenses', active: url.startsWith('/expenses') },
        { label: 'Trial Balance', href: '/reports/trial-balance', active: url.startsWith('/reports/trial-balance') },
        { label: 'Profit & Loss', href: '/reports/profit-loss', active: url.startsWith('/reports/profit-loss') },
        { label: 'General Ledger', href: '/reports/general-ledger', active: url.startsWith('/reports/general-ledger') },
        { label: 'Valuation Report', href: '/reports/inventory-valuation', active: url.startsWith('/reports/inventory-valuation') },
        { label: 'Product Profit', href: '/reports/product-profit', active: url.startsWith('/reports/product-profit') },
        { label: 'Expiry & Alerts', href: '/reports/expiry', active: url.startsWith('/reports/expiry') },
        { label: 'Receivables / Payables', href: '/reports/receivables-payables', active: url.startsWith('/reports/receivables-payables') },
        { label: 'Shop settings', href: '/settings/shop', active: url.startsWith('/settings/shop') },
    ];

    if (auth.user?.is_super_admin) {
        navigation.push({
            label: 'Super Admin Panel',
            href: '/super-admin/tenants',
            active: url.startsWith('/super-admin/tenants')
        });
    }

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
