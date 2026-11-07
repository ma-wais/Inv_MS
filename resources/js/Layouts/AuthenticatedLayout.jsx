import ShopAvatar from '../Components/ShopAvatar';
import SearchableSelect from '../Components/SearchableSelect';
import { Link, router, usePage } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';

// SVG Icon definitions
// Modern Executive SVG Icon definitions
const dashboardIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
);

const inventoryIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
);

const purchasingIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M16 10a4 4 0 01-8 0" />
    </svg>
);

const salesIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const accountingIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 10H2M10 14h4" />
    </svg>
);

const reportsIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
);

const settingsIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const superAdminIcon = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
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
            setTimeStr(new Date().toLocaleTimeString(undefined, { timeZone: auth.tenant?.timezone || 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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
    
    // Theme mode state (scalable for additional color themes)
    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem('app_theme');
            if (saved) return saved;
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    });

    useEffect(() => {
        try {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            localStorage.setItem('app_theme', theme);
        } catch (e) {
            // ignore
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

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
    const isShopAdmin = auth.user?.is_super_admin || auth.role === 'admin';

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
    }

    if (!auth.user?.is_super_admin || auth.tenant) {
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

    if (!isShopAdmin) {
        for (const section of sections) {
            if (section.key === 'accounting' || section.key === 'settings') section.items = [];
            if (section.key === 'user_management') section.items = section.items.filter(item => item.href === '/profile');
            if (section.key === 'reports') section.items = section.items.filter(item => !['/reports/trial-balance', '/reports/profit-loss', '/reports/general-ledger'].includes(item.href));
        }
    }
    for (let index = sections.length - 1; index >= 0; index--) {
        if (sections[index].items.length === 0) sections.splice(index, 1);
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
        <div className="min-h-screen bg-surface-hover/80 text-foreground flex flex-col lg:flex-row antialiased selection:bg-emerald-500 selection:text-white">
            
            {/* Mobile Header Navbar */}
            <div className="lg:hidden flex items-center justify-between bg-slate-950 text-white px-4 py-3 sticky top-0 z-40 shadow-md print:hidden">
                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="p-2 rounded-lg bg-slate-900 text-slate-200 hover:text-white focus:outline-hidden cursor-pointer"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-foreground font-black text-xs">
                        IMS
                    </div>
                    <span className="font-bold text-white text-base tracking-tight">Inventory MS</span>
                </div>
                <div className="w-8"></div>
            </div>

            {/* Mobile Backdrop Overlay */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
                ></div>
            )}

            {/* Sticky 100vh Viewport Fixed Sidebar Drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/80 text-white flex flex-col transition-all duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen shrink-0 print:hidden ${
                    isCompressed ? 'lg:w-20' : 'lg:w-64'
                } ${
                    mobileOpen ? 'visible translate-x-0 w-64' : 'invisible -translate-x-full w-64 lg:visible'
                }`}
            >
                {/* 1. Fixed Top Header */}
                <div className="flex-none p-4 flex items-center justify-between border-b border-slate-800/60">
                    <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 overflow-hidden whitespace-nowrap group"
                    >
                        <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center text-foreground font-black text-xs shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                            IMS
                        </div>
                        {!isCompressed && (
                            <div className="min-w-0">
                                <span className="text-base font-extrabold tracking-tight text-white block truncate leading-tight">
                                    Inventory MS
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-400 block truncate">
                                    Enterprise Portal
                                </span>
                            </div>
                        )}
                    </Link>

                    {/* Close button for mobile */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden text-subtle hover:text-white p-1 cursor-pointer"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 2. Scrollable Middle Navigation Menu */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2.5 custom-scrollbar">
                    {/* Direct Dashboard Link */}
                    {isCompressed ? (
                        <div className="group relative flex justify-center py-0.5">
                            <Link
                                href="/dashboard"
                                onClick={() => setMobileOpen(false)}
                                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                                    url === '/dashboard' || url.startsWith('/dashboard/')
                                        ? 'bg-emerald-500/20 text-emerald-300 font-bold shadow-xs'
                                        : 'text-slate-300 hover:bg-surface/5 hover:text-white'
                                }`}
                            >
                                {dashboardIcon}
                            </Link>
                            
                            {/* Hover Tooltip */}
                            <div className="absolute left-full top-2 ml-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 shadow-xl hidden group-hover:block z-50 whitespace-nowrap">
                                <span className="text-xs text-slate-200 font-semibold font-sans">Dashboard</span>
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/dashboard"
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                                url === '/dashboard' || url.startsWith('/dashboard/')
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'text-slate-300 hover:bg-surface/5 hover:text-white'
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
                                <div key={section.key} className="group relative flex justify-center py-0.5">
                                    <button
                                        type="button"
                                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
                                            hasActiveItem
                                                ? 'bg-emerald-500/20 text-emerald-300 font-bold shadow-xs'
                                                : 'text-slate-300 hover:bg-surface/5 hover:text-white'
                                        }`}
                                    >
                                        {section.icon}
                                    </button>
                                    
                                    {/* Hover Popover */}
                                    <div className="absolute left-full top-0 ml-3 w-56 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl hidden group-hover:block z-50">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2 px-2 border-b border-slate-800 pb-1.5">
                                            {section.label}
                                        </p>
                                        <div className="space-y-1">
                                            {section.items.map((item) => (
                                                <Link
                                                    key={item.label}
                                                    href={item.href}
                                                    onClick={() => setMobileOpen(false)}
                                                    className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                                                        item.active
                                                            ? 'bg-emerald-500/15 font-semibold text-emerald-300'
                                                            : 'text-slate-300 hover:bg-surface/5 hover:text-white'
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
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-subtle hover:bg-surface/5 hover:text-slate-200 transition-colors cursor-pointer"
                                >
                                    <span className="flex items-center gap-2.5">
                                        {section.icon}
                                        <span>{section.label}</span>
                                    </span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className={`h-4 w-4 text-muted transition-transform ${isExpanded ? 'rotate-90 text-emerald-400' : ''}`}
                                    >
                                        <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                
                                {isExpanded && (
                                    <div className="pl-3 space-y-0.5 border-l border-slate-800/80 ml-4 mt-1">
                                        {section.items.map((item) => (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                onClick={() => setMobileOpen(false)}
                                                className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                                    item.active
                                                        ? 'bg-emerald-500/15 font-semibold text-emerald-300 border-l-2 border-emerald-400 rounded-l-none pl-3.5'
                                                        : 'text-slate-300 hover:bg-surface/5 hover:text-white'
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

                {/* 3. Fixed Bottom User & Logout Section (Guaranteed 100vh Sticky Viewport Visibility) */}
                <div className="flex-none border-t border-slate-800/80 p-3 bg-slate-950/70">
                    {!isCompressed && auth.tenant && (
                        <div className="mb-2 px-1 flex items-center justify-between text-[11px] text-subtle">
                            <span className="font-semibold text-slate-200 truncate">{auth.tenant.name}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                                Active
                            </span>
                        </div>
                    )}

                    {isCompressed ? (
                        <div className="flex flex-col items-center gap-2">
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                                title="Logout"
                            >
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2.5 rounded-xl bg-slate-900/60 p-2.5 border border-slate-800/50">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-200 truncate">{auth.user.name}</p>
                                <p className="text-[10px] text-subtle truncate">{auth.user.email}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-colors cursor-pointer"
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
            <div className="flex-1 flex flex-col min-w-0 bg-surface-hover/80 dark:bg-slate-950 text-foreground dark:text-slate-100">
                <header className="sticky top-0 z-30 border-b border-line/80 dark:border-slate-800/80 bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md print:hidden shadow-2xs">
                    <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
                        <div className="flex min-w-0 items-center gap-3">
                            {/* Collapse/Expand button for desktop */}
                            <button
                                type="button"
                                onClick={toggleCompressed}
                                className="hidden lg:flex items-center justify-center h-9 w-9 text-muted dark:text-slate-400 hover:text-foreground dark:hover:text-slate-100 rounded-lg bg-surface-hover dark:bg-slate-800 hover:bg-surface-hover/80 dark:hover:bg-slate-700 transition-colors focus:outline-hidden cursor-pointer"
                                title={isCompressed ? "Expand Sidebar" : "Collapse Sidebar"}
                            >
                                {isCompressed ? (
                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                ) : (
                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                                    </svg>
                                )}
                            </button>

                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-[10px] font-bold uppercase tracking-widest text-success-ink dark:text-emerald-400">
                                    <span className="inline-flex items-center gap-2"><ShopAvatar name={auth.tenant?.name ?? 'System Control'} logo={auth.tenant?.logo_url} className="h-7 w-7" />{auth.tenant?.name ?? 'System Control'}</span>
                                </span>
                                <h1 className="truncate text-base font-extrabold text-foreground dark:text-white tracking-tight">{title}</h1>
                            </div>
                        </div>

                        {/* Center Clock Widget */}
                        <div className="hidden md:flex items-center gap-2 bg-surface-hover dark:bg-slate-800 border border-line/70 dark:border-slate-700/80 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-foreground dark:text-slate-300 font-mono tracking-wider shadow-2xs">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>{timeStr}</span>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                            {/* Theme Toggle Button (Light / Dark mode, scalable for more themes) */}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line dark:border-slate-700 bg-surface-muted dark:bg-slate-800 text-muted dark:text-slate-300 hover:bg-surface-hover dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {theme === 'dark' ? (
                                    /* Sun Icon for Light Mode Switch */
                                    <svg className="h-4.5 w-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    /* Moon Icon for Dark Mode Switch */
                                    <svg className="h-4.5 w-4.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>

                            {auth.tenant && (
                                <div className="hidden items-center gap-2 rounded-xl border border-line dark:border-slate-700 bg-surface-muted/80 dark:bg-slate-800/80 px-3 py-1.5 shadow-2xs sm:flex">
                                    <svg className="h-4 w-4 text-subtle dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <div className="min-w-36 max-w-52"><SearchableSelect dense label="Current shop" value={auth.tenant?.id ?? ''} onChange={switchTenant} options={auth.tenants.map(tenant => [tenant.id, tenant.name])} /></div>
                                </div>
                            )}

                            {/* Circular Profile Avatar Dropdown (Clean Neutral Hover - No Green Hover) */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-2.5 focus:outline-hidden cursor-pointer group p-1 rounded-xl hover:bg-surface-hover dark:hover:bg-slate-800 transition-colors"
                                >
                                    {auth.user.image_url ? (
                                        <img
                                            src={auth.user.image_url}
                                            alt={auth.user.name}
                                            className="h-9 w-9 rounded-full object-cover border border-line dark:border-slate-700 shadow-xs group-hover:border-slate-400 dark:group-hover:border-slate-500 transition-colors"
                                        />
                                    ) : (
                                        <div className="h-9 w-9 rounded-full bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs flex items-center justify-center border border-slate-800 dark:border-slate-700 shadow-xs group-hover:bg-slate-800 dark:group-hover:bg-slate-700 transition-colors">
                                            {auth.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="hidden text-left xl:block">
                                        <p className="text-xs font-bold text-foreground dark:text-slate-100 leading-tight group-hover:text-foreground dark:group-hover:text-slate-300 transition-colors">{auth.user.name}</p>
                                        <p className="text-[10px] text-subtle font-bold uppercase tracking-wider">{auth.role ?? 'User'}</p>
                                    </div>
                                    <svg className="h-4 w-4 text-subtle dark:text-slate-500 group-hover:text-muted dark:group-hover:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line dark:border-slate-800 bg-surface dark:bg-slate-900 p-2 shadow-xl animate-in fade-in slide-in-from-top-3 duration-150 z-50">
                                        <div className="px-3 py-2 border-b border-line-soft dark:border-slate-800 mb-1">
                                            <p className="text-xs font-bold text-foreground dark:text-slate-200">{auth.user.name}</p>
                                            <p className="text-[10px] text-subtle truncate">{auth.user.email}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            onClick={() => setProfileMenuOpen(false)}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-foreground dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors group"
                                        >
                                            <svg className="h-4 w-4 text-subtle dark:text-slate-500 group-hover:text-muted dark:group-hover:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            My Profile
                                        </Link>
                                        <Link href="/shops/select" className="block rounded-lg px-3 py-2 text-xs font-semibold text-foreground dark:text-slate-200">Switch shop</Link>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProfileMenuOpen(false);
                                                router.post('/logout');
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-danger-ink dark:text-red-400 hover:bg-danger-soft dark:hover:bg-red-950/40 transition-colors cursor-pointer group"
                                        >
                                            <svg className="h-4 w-4 text-red-400 dark:text-red-400 group-hover:text-danger-ink transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                <main className="p-4 sm:p-6 lg:p-7 flex-1 min-w-0 max-w-full">{children}</main>
            </div>
        </div>
    );
}
