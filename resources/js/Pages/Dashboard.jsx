import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import React, { useState } from 'react';

export default function Dashboard({ summary, branches, sales_history, purchases_history = [], expenses_history = [] }) {
    const money = (val) => Number(val ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <AuthenticatedLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* 1. Primary Financial and Operational Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Today's Sales Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Sales</p>
                            <p className="mt-2 text-xl font-bold text-slate-800">PKR {money(summary.today_sales)}</p>
                        </div>
                        <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Cash balance Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cash on Hand</p>
                            <p className="mt-2 text-xl font-bold text-slate-800">PKR {money(summary.cash_balance)}</p>
                        </div>
                        <div className="rounded-full bg-slate-50 p-3 text-slate-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                    </div>

                    {/* Customer Receivables Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer Receivables</p>
                            <p className="mt-2 text-xl font-bold text-slate-800">PKR {money(summary.ar_balance)}</p>
                        </div>
                        <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Low Stock Card */}
                    <div className={`rounded-2xl border p-5 shadow-xs flex items-center justify-between ${summary.low_stock_count > 0 ? 'border-amber-200 bg-amber-50/15' : 'border-slate-200 bg-white'}`}>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Low Stock Alerts</p>
                            <p className={`mt-2 text-xl font-bold ${summary.low_stock_count > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                                {summary.low_stock_count} {summary.low_stock_count === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                        <div className={`rounded-full p-3 ${summary.low_stock_count > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>

                    {/* Today's Purchases Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Purchases</p>
                            <p className="mt-2 text-xl font-bold text-slate-800">PKR {money(summary.today_purchases)}</p>
                        </div>
                        <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                    </div>

                    {/* Active Warehouses Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Warehouses</p>
                            <p className="mt-2 text-xl font-bold text-slate-800">{summary.warehouses}</p>
                        </div>
                        <div className="rounded-full bg-indigo-50 p-3 text-indigo-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>

                    {/* Chart of Accounts Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chart of Accounts</p>
                            <p className="mt-2 text-xl font-bold text-slate-800">{summary.accounts}</p>
                        </div>
                        <div className="rounded-full bg-violet-50 p-3 text-violet-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                    </div>

                    {/* Staff Members Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Staff Members</p>
                            <p className="mt-2 text-xl font-bold text-slate-800">{summary.users}</p>
                        </div>
                        <div className="rounded-full bg-rose-50 p-3 text-rose-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 2. Quick Action Links & Buttons */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-base font-bold text-slate-800 mb-4">Quick Operations Hub</h2>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <Link
                            href="/pos"
                            className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-center hover:border-emerald-200 hover:bg-emerald-50/20 group transition-all"
                        >
                            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 group-hover:scale-110 transition-transform">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="mt-2 text-sm font-semibold text-slate-700">POS Billing</span>
                        </Link>

                        <Link
                            href="/sales"
                            className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-center hover:border-emerald-200 hover:bg-emerald-50/20 group transition-all"
                        >
                            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 group-hover:scale-110 transition-transform">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="mt-2 text-sm font-semibold text-slate-700">Sales Invoices</span>
                        </Link>

                        <Link
                            href="/purchases"
                            className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-center hover:border-emerald-200 hover:bg-emerald-50/20 group transition-all"
                        >
                            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 group-hover:scale-110 transition-transform">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <span className="mt-2 text-sm font-semibold text-slate-700">New Purchase</span>
                        </Link>

                        <Link
                            href="/expenses"
                            className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-center hover:border-emerald-200 hover:bg-emerald-50/20 group transition-all"
                        >
                            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 group-hover:scale-110 transition-transform">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <span className="mt-2 text-sm font-semibold text-slate-700">Log Expense</span>
                        </Link>

                        <Link
                            href="/reports/profit-loss"
                            className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-center hover:border-emerald-200 hover:bg-emerald-50/20 group transition-all sm:col-span-2 lg:col-span-1"
                        >
                            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 group-hover:scale-110 transition-transform">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                                </svg>
                            </div>
                            <span className="mt-2 text-sm font-semibold text-slate-700">Profit & Loss</span>
                        </Link>
                    </div>
                </div>

                {/* 3. Two-Column History Charts Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    <HistoryChart
                        title="Sales Trend"
                        subtitle="Gross sales over past 7 days"
                        data={sales_history}
                        gradientStart="#34d399"
                        gradientEnd="#059669"
                        hoverColor="#047857"
                        badgeText="Sales"
                    />

                    <HistoryChart
                        title="Purchases Trend"
                        subtitle="Gross purchases over past 7 days"
                        data={purchases_history}
                        gradientStart="#fbbf24"
                        gradientEnd="#d97706"
                        hoverColor="#b45309"
                        badgeText="Purchases"
                    />

                    <HistoryChart
                        title="Expenses Trend"
                        subtitle="Gross expenses over past 7 days"
                        data={expenses_history}
                        gradientStart="#f43f5e"
                        gradientEnd="#be123c"
                        hoverColor="#9f1239"
                        badgeText="Expenses"
                    />
                </div>

                {/* 4. Branches Setup Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-md">
                    <h2 className="font-bold text-slate-800">Branches Setup</h2>
                    <p className="text-xs text-slate-500 mt-1">Multi-branch locations available for this shop.</p>
                    
                    <div className="mt-4 space-y-3">
                        {branches.map((branch) => (
                            <div key={branch.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{branch.name}</p>
                                    <p className="text-xs text-slate-500 font-mono">{branch.code || '—'}</p>
                                </div>
                                {branch.is_default && (
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                        Default
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}

function HistoryChart({ title, subtitle, data, gradientStart, gradientEnd, hoverColor, badgeText, prefix = 'PKR' }) {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const maxVal = Math.max(...data.map(d => d.total), 1000);
    const chartHeight = 130;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-full min-h-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${gradientStart}15`, color: hoverColor }}>
                    {badgeText}
                </span>
            </div>

            <div className="relative flex-1 min-h-36 flex items-end">
                <svg className="w-full h-32 overflow-visible" xmlns="http://www.w3.org/2000/svg">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = chartHeight - (ratio * chartHeight);
                        return (
                            <g key={ratio}>
                                <line x1="0" y1={y} x2="100%" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                                {ratio > 0 && (
                                    <text x="0" y={y - 4} fill="#94a3b8" fontSize="8" className="font-mono">
                                        {prefix} {((ratio * maxVal) / 1000).toFixed(0)}k
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Bars */}
                    {data.map((d, index) => {
                        const barWidth = 20;
                        const xPercent = (index / (data.length - 1)) * 82 + 8;
                        const height = maxVal > 0 ? (d.total / maxVal) * chartHeight : 0;
                        const y = chartHeight - height;
                        const isHovered = hoveredIdx === index;
                        const gradientId = `grad-${title.replace(/\s+/g, '-')}`;

                        return (
                            <g key={index} onMouseEnter={() => setHoveredIdx(index)} onMouseLeave={() => setHoveredIdx(null)}>
                                <rect
                                    x={`${xPercent}%`}
                                    y={y}
                                    width={barWidth}
                                    height={height}
                                    rx="4"
                                    fill={isHovered ? hoverColor : `url(#${gradientId})`}
                                    className="cursor-pointer transition-colors duration-200"
                                />
                                <text
                                    x={`${xPercent}%`}
                                    dx={barWidth / 2}
                                    y={chartHeight + 14}
                                    textAnchor="middle"
                                    fill="#64748b"
                                    fontSize="10"
                                    className="font-bold"
                                >
                                    {d.day}
                                </text>

                                {isHovered && (
                                    <g className="z-20">
                                        <rect
                                            x={`${xPercent - 8}%`}
                                            y={y - 25}
                                            width="84"
                                            height="20"
                                            rx="4"
                                            fill="#0f172a"
                                        />
                                        <text
                                            x={`${xPercent}%`}
                                            dx={barWidth / 2}
                                            y={y - 12}
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="9"
                                            className="font-bold"
                                        >
                                            {prefix} {Number(d.total.toFixed(0)).toLocaleString()}
                                        </text>
                                    </g>
                                )}

                                <defs>
                                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={gradientStart} />
                                        <stop offset="100%" stopColor={gradientEnd} />
                                    </linearGradient>
                                </defs>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
