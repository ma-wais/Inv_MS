import { Link, router, usePage } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';

// SVG Icon definitions
const dashboardIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const inventoryIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const purchasingIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

const salesIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const accountingIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-6 2h6m-6 2h6m-6 2h6M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
    </svg>
);

const reportsIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const settingsIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const superAdminIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

export default function AuthenticatedLayout({ title, children }) {
    const { auth } = usePage().props;
    const { url } = usePage();

    const [mobileOpen, setMobileOpen] = useState(false);

    // Running clock
    const [timeStr, setTimeStr] = useState('');
    useEffect(() => {
        const update = () => {
            setTimeStr(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    // Profile dropdown
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Sidebar collapse state
    const [isCompressed, setIsCompressed] = useState(() => {
        try {
            return localStorage.getItem('sidebar_compressed') === 'true';
        } catch {
            return false;
        }
    });

    const toggleCompressed = () => {
        const next = !isCompressed;
        setIsCompressed(next);
        try {
            localStorage.setItem('sidebar_compressed', String(next));
        } catch (e) {
            // ignore
        }
    };

    const enabledReports = auth.tenant?.meta?.enabled_reports ?? ['valuation', 'profit', 'expiry', 'receivables_payables'];

    // Single active section state (only one section can be open at a time)
    const [expandedSection, setExpandedSection] = useState(() => {
        try {
            return localStorage.getItem('sidebar_expanded_section') || 'inventory';
        } catch {
            return 'inventory';
        }
    });

    const toggleSection = (sectionKey) => {
        const next = expandedSection === sectionKey ? null : sectionKey;
        setExpandedSection(next);
        try {
            if (next === null) {
                localStorage.removeItem('sidebar_expanded_section');
            } else {
                localStorage.setItem('sidebar_expanded_section', next);
            }
        } catch (e) {
            // ignore
        }
    };

    const sections = [];

    if (auth.user?.is_super_admin) {
        sections.push({
            key: 'super_admin',
            label: 'System Admin',
            icon: superAdminIcon,
            items: [
                { label: 'Manage Shops', href: '/super-admin/tenants', active: url.startsWith('/super-admin/tenants') },
                { label: 'Manage Users', href: '/super-admin/users', active: url.startsWith('/super-admin/users') },
                { label: 'Database Backups', href: '/super-admin/backups', active: url.startsWith('/super-admin/backups') },
                { label: 'System Activity Logs', href: '/super-admin/activity-logs', active: url.startsWith('/super-admin/activity-logs') }
            ]
        });
    } else {
        sections.push(
            {
                key: 'inventory',
                label: 'Inventory & Setup',
                icon: inventoryIcon,
                items: [
                    { label: 'Products List', href: '/products', active: url.startsWith('/products') },
                    { label: 'Catalog Setup', href: '/inventory/setup', active: url.startsWith('/inventory/setup') },
                    { label: 'Stock Adjustments', href: '/stock', active: url.startsWith('/stock') },
                ]
            },
            {
                key: 'purchasing',
                label: 'Purchasing',
                icon: purchasingIcon,
                items: [
                    { label: 'Suppliers List', href: '/suppliers', active: url.startsWith('/suppliers') },
                    { label: 'New Purchase', href: '/purchases/create', active: url.startsWith('/purchases/create') },
                    { label: 'Purchase Invoices', href: '/purchases', active: url.startsWith('/purchases') && !url.startsWith('/purchases/returns') && !url.startsWith('/purchases/create') },
                    { label: 'Purchase Returns', href: '/purchases/returns', active: url.startsWith('/purchases/returns') },
                ]
            },
            {
                key: 'sales',
                label: 'Sales & POS',
                icon: salesIcon,
                items: [
                    { label: 'Customers List', href: '/customers', active: url.startsWith('/customers') },
                    { label: 'Sales Invoices', href: '/sales', active: url.startsWith('/sales') && !url.startsWith('/sales/returns') },
                    { label: 'Sales Returns', href: '/sales/returns', active: url.startsWith('/sales/returns') },
                    { label: 'POS Billing', href: '/pos', active: url.startsWith('/pos') },
                ]
            },
            {
                key: 'accounting',
                label: 'Accounting Ledger',
                icon: accountingIcon,
                items: [
                    { label: 'Add Account', href: '/accounts/create', active: url.startsWith('/accounts/create') },
                    { label: 'Chart of Accounts', href: '/accounts', active: url.startsWith('/accounts') && !url.startsWith('/accounts/create') },
                    { label: 'Journal Entries', href: '/journals', active: url.startsWith('/journals') },
                    { label: 'Expenses Log', href: '/expenses', active: url.startsWith('/expenses') },
                ]
            },
            {
                key: 'reports',
                label: 'Reports & Statements',
                icon: reportsIcon,
                items: [
                    { label: 'Trial Balance', href: '/reports/trial-balance', active: url.startsWith('/reports/trial-balance') },
                    { label: 'Profit & Loss', href: '/reports/profit-loss', active: url.startsWith('/reports/profit-loss') },
                    { label: 'General Ledger', href: '/reports/general-ledger', active: url.startsWith('/reports/general-ledger') },
                    ...(enabledReports.includes('valuation') ? [{ label: 'Valuation Report', href: '/reports/inventory-valuation', active: url.startsWith('/reports/inventory-valuation') }] : []),
                    ...(enabledReports.includes('profit') ? [{ label: 'Product Profit', href: '/reports/product-profit', active: url.startsWith('/reports/product-profit') }] : []),
                    ...(enabledReports.includes('expiry') ? [{ label: 'Expiry & Alerts', href: '/reports/expiry', active: url.startsWith('/reports/expiry') }] : []),
                    ...(enabledReports.includes('receivables_payables') ? [{ label: 'Receivables / Payables', href: '/reports/receivables-payables', active: url.startsWith('/reports/receivables-payables') }] : []),
                ]
            },
            {
                key: 'user_management',
                label: 'User Management',
                icon: (
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                ),
                items: [
                    { label: 'My Profile', href: '/profile', active: url.startsWith('/profile') },
                    { label: 'Staff Management', href: '/settings/staff', active: url.startsWith('/settings/staff') },
                ]
            },
            {
                key: 'settings',
                label: 'Settings',
                icon: settingsIcon,
                items: [
                    { label: 'Shop settings', href: '/settings/shop', active: url.startsWith('/settings/shop') },
                    { label: 'Media Gallery', href: '/settings/media', active: url.startsWith('/settings/media') },
                ]
            }
        );
    }

    // Auto-expand section that contains the currently active route
    useEffect(() => {
        const activeSection = sections.find(section =>
            section.items.some(item => item.active)
        );
        if (activeSection) {
            setExpandedSection(activeSection.key);
        }
    }, [url]);

    function switchTenant(event) {
        router.post(`/shops/${event.target.value}/select`);
    }

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row">
            
            {/* Mobile Header Navbar */}
            <div className="lg:hidden flex items-center justify-between bg-slate-950 text-white px-4 py-3 sticky top-0 z-40 shadow-md print:hidden">
                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="p-1.5 rounded-md hover:bg-white/5 text-slate-200 focus:outline-hidden cursor-pointer"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span className="font-bold text-emerald-300 text-lg">Ventory</span>
                <div className="w-8"></div>
            </div>

            {/* Mobile Backdrop Overlay */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
                ></div>
            )}

            {/* Sidebar Drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-linear-to-b from-slate-900 to-slate-950 border-r border-slate-800/80 px-4 py-5 text-white flex flex-col transition-all duration-200 ease-in-out lg:translate-x-0 lg:static lg:min-h-screen lg:h-auto lg:z-auto shrink-0 print:hidden overflow-y-auto ${
                    isCompressed ? 'lg:w-20 lg:px-2' : 'lg:w-64'
                } ${
                    mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
                }`}
            >
                <div className="flex justify-between items-center px-2 mb-6">
                    <div className="overflow-hidden whitespace-nowrap">
                        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-emerald-300" onClick={() => setMobileOpen(false)}>
                            {isCompressed ? 'V' : 'Ventory'}
                        </Link>
                        {!isCompressed && <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-400">Shop operations</p>}
                    </div>
                    {/* Close button for mobile */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden text-slate-300 hover:text-white p-1 cursor-pointer"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 space-y-3">
                    {/* Direct Dashboard Link */}
                    {isCompressed ? (
                        <div className="group relative flex justify-center py-1">
                            <Link
                                href="/dashboard"
                                onClick={() => setMobileOpen(false)}
                                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                                    url === '/dashboard' || url.startsWith('/dashboard/')
                                        ? 'bg-emerald-400/15 text-emerald-200 font-bold'
                                        : 'text-slate-100 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                {dashboardIcon}
                            </Link>
                            
                            {/* Hover Tooltip */}
                            <div className="absolute left-full top-2.5 ml-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 shadow-xl hidden group-hover:block z-50 whitespace-nowrap">
                                <span className="text-xs text-slate-200 font-semibold font-sans">Dashboard</span>
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/dashboard"
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                                url === '/dashboard' || url.startsWith('/dashboard/')
                                    ? 'bg-emerald-400/15 text-emerald-200 font-bold'
                                    : 'text-slate-100 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            {dashboardIcon}
                            <span>Dashboard</span>
                        </Link>
                    )}

                    {/* Grouped Accordions / Popovers */}
                    {sections.map((section) => {
                        const isExpanded = expandedSection === section.key;
                        const hasActiveItem = section.items.some(item => item.active);

                        if (isCompressed) {
                            return (
                                <div key={section.key} className="group relative flex justify-center py-1">
                                    <button
                                        type="button"
                                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all cursor-pointer ${
                                            hasActiveItem
                                                ? 'bg-emerald-400/15 text-emerald-300 font-bold'
                                                : 'text-slate-200 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        {section.icon}
                                    </button>
                                    
                                    {/* Hover Popover */}
                                    <div className="absolute left-full top-0 ml-3 w-56 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl hidden group-hover:block z-50">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2 border-b border-slate-800 pb-1.5">
                                            {section.label}
                                        </p>
                                        <div className="space-y-1">
                                            {section.items.map((item) => (
                                                <Link
                                                    key={item.label}
                                                    href={item.href}
                                                    onClick={() => setMobileOpen(false)}
                                                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                                                        item.active
                                                            ? 'bg-emerald-400/10 font-semibold text-emerald-300'
                                                            : 'text-slate-200 hover:bg-white/5 hover:text-white'
                                                    }`}
                                                >
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={section.key} className="space-y-1">
                                <button
                                    type="button"
                                    onClick={() => toggleSection(section.key)}
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors cursor-pointer"
                                >
                                <span className="flex items-center gap-2">
                                    {section.icon}
                                    <span>{section.label}</span>
                                </span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className={`h-4.5 w-4.5 text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                >
                                        <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                
                                {isExpanded && (
                                    <div className="pl-2 space-y-0.5 border-l border-slate-800 ml-4.5 mt-1">
                                        {section.items.map((item) => (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                onClick={() => setMobileOpen(false)}
                                                className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-all ${
                                                    item.active
                                                        ? 'bg-emerald-500/10 font-semibold text-emerald-400 pl-4 border-l-2 border-emerald-500 rounded-l-none'
                                                        : 'text-slate-200 hover:bg-white/5 hover:text-white'
                                                }`}
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom User Info & Logout Section */}
                <div className="mt-auto border-t border-slate-800/50 pt-4 px-2 flex flex-col gap-3">
                    {/* Tenant Info if expanded */}
                    {!isCompressed && auth.tenant && (
                        <div className="text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-200">{auth.tenant.name}</span>
                            <span className="mx-1.5">•</span>
                            <span>Active Shop</span>
                        </div>
                    )}

                    {/* User profile details and logout */}
                    {isCompressed ? (
                        <div className="flex flex-col items-center gap-4">
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                                title="Logout"
                            >
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2 bg-slate-900/40 rounded-xl p-2.5 border border-slate-800/30">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-200 truncate">{auth.user.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{auth.user.email}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                                title="Logout"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-30 border-b border-slate-200/85 bg-slate-50/90 backdrop-blur-md print:hidden">
                    <div className="flex min-h-16 items-center justify-between gap-4 px-5 lg:px-8">
                        <div className="flex items-center gap-3">
                            {/* Collapse/Expand button for desktop */}
                            <button
                                type="button"
                                onClick={toggleCompressed}
                                className="hidden lg:block text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
                                title={isCompressed ? "Expand Sidebar" : "Collapse Sidebar"}
                            >
                                {isCompressed ? (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                                    </svg>
                                )}
                            </button>

                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {auth.tenant?.name ?? 'Shop Manager'}
                                </span>
                                <h1 className="text-sm font-semibold text-slate-800">{title}</h1>
                            </div>
                        </div>

                        {/* Center Clock Widget */}
                        <div className="hidden md:flex items-center gap-2 bg-slate-200/50 border border-slate-200/30 rounded-xl px-3.5 py-1.5 shadow-xs text-xs font-semibold text-slate-600 font-mono tracking-wider">
                            <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{timeStr}</span>
                        </div>

                        <div className="flex items-center gap-4">
                            {auth.tenant && (
                                <select
                                    value={auth.tenant?.id ?? ''}
                                    onChange={switchTenant}
                                    className="max-w-48 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold cursor-pointer outline-none focus:border-emerald-500"
                                >
                                    {auth.tenants.map((tenant) => (
                                        <option key={tenant.id} value={tenant.id}>
                                            {tenant.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Circular Profile Avatar Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-2.5 focus:outline-hidden cursor-pointer group"
                                >
                                    {auth.user.image_path ? (
                                        <img
                                            src={`/storage/${auth.user.image_path}`}
                                            alt={auth.user.name}
                                            className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-xs group-hover:border-emerald-500 transition-colors"
                                        />
                                    ) : (
                                        <div className="h-9 w-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center border border-emerald-500 shadow-xs group-hover:bg-emerald-700 transition-colors">
                                            {auth.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="hidden text-left xl:block">
                                        <p className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">{auth.user.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{auth.role ?? 'Member'}</p>
                                    </div>
                                    <svg className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-3 duration-150 z-50">
                                        <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                            <p className="text-xs font-bold text-slate-800">{auth.user.name}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{auth.user.email}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            onClick={() => setProfileMenuOpen(false)}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors group"
                                        >
                                            <svg className="h-4 w-4 text-slate-400 group-hover:text-slate-650 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            My Profile
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProfileMenuOpen(false);
                                                router.post('/logout');
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 transition-colors cursor-pointer group"
                                        >
                                            <svg className="h-4 w-4 text-red-450 group-hover:text-red-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-5 lg:p-8 flex-1">{children}</main>
            </div>
        </div>
    );
}
