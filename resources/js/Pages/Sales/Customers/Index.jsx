import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../../Components/FloatingInput';
import PhoneInput from '../../../Components/PhoneInput';
import React, { useState } from 'react';
import { router } from '@inertiajs/react';

export default function Index({ customers, filters = {} }) {
    const { flash } = usePage().props;
    const form = useForm({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        credit_limit: '',
        opening_balance: '0',
        notes: '',
    });

    const [sortField, setSortField] = useState(filters.sort || 'name');
    const [sortDirection, setSortDirection] = useState(filters.direction || 'asc');

    const handleSort = (field) => {
        const nextDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(nextDirection);
        router.get('/customers', {
            search: filters.search || '',
            sort: field,
            direction: nextDirection
        }, { preserveState: true });
    };

    function handleSearch(event) {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('search');
        router.get('/customers', {
            search: value,
            sort: sortField,
            direction: sortDirection
        }, { preserveState: true });
    }

    function submit(event) {
        event.preventDefault();
        form.post('/customers', { preserveScroll: true, onSuccess: () => form.reset() });
    }

    return (
        <AuthenticatedLayout title="Customers">
            <Head title="Customers" />

            {flash.status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.status}</div>}

            <div className="space-y-6">
                {/* Form Card at Top */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-base text-slate-800 mb-4">Add customer</h2>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            <FloatingInput
                                label="Customer Name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                required
                                error={form.errors.name}
                            />
                            <FloatingInput
                                label="Contact Person"
                                value={form.data.contact_person}
                                onChange={(e) => form.setData('contact_person', e.target.value)}
                                error={form.errors.contact_person}
                            />
                            <FloatingInput
                                label="Email Address"
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                error={form.errors.email}
                            />
                            <PhoneInput
                                label="Phone Number"
                                name="phone"
                                value={form.data.phone}
                                onChange={(e) => form.setData('phone', e.target.value)}
                                error={form.errors.phone}
                            />
                            <FloatingInput
                                label="Credit Limit"
                                type="number"
                                step="any"
                                value={form.data.credit_limit}
                                onChange={(e) => form.setData('credit_limit', e.target.value)}
                                error={form.errors.credit_limit}
                            />
                            <FloatingInput
                                label="Opening Balance"
                                type="number"
                                step="any"
                                value={form.data.opening_balance}
                                onChange={(e) => form.setData('opening_balance', e.target.value)}
                                required
                                error={form.errors.opening_balance}
                            />
                            {/* Address Textarea */}
                            <div className="relative w-full">
                                <textarea
                                    id="address"
                                    value={form.data.address}
                                    onChange={(e) => form.setData('address', e.target.value)}
                                    placeholder=" "
                                    className="peer block w-full rounded-xl border border-slate-200 bg-white px-4 pb-1.5 pt-4 text-xs text-slate-800 outline-none transition-all focus:border-emerald-500 h-[50px] min-h-[50px] resize-none"
                                />
                                <label
                                    htmlFor="address"
                                    className="absolute left-4 top-1.5 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-[10px] text-slate-400 duration-150 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
                                >
                                    Address
                                </label>
                                {form.errors.address && <p className="mt-0.5 text-[10px] text-red-600">{form.errors.address}</p>}
                            </div>
                            {/* Notes Textarea */}
                            <div className="relative w-full">
                                <textarea
                                    id="notes"
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    placeholder=" "
                                    className="peer block w-full rounded-xl border border-slate-200 bg-white px-4 pb-1.5 pt-4 text-xs text-slate-800 outline-none transition-all focus:border-emerald-500 h-[50px] min-h-[50px] resize-none"
                                />
                                <label
                                    htmlFor="notes"
                                    className="absolute left-4 top-1.5 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-[10px] text-slate-400 duration-150 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
                                >
                                    Notes
                                </label>
                                {form.errors.notes && <p className="mt-0.5 text-[10px] text-red-600">{form.errors.notes}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                disabled={form.processing}
                                className="rounded-xl bg-slate-950 px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-900 disabled:opacity-60 cursor-pointer"
                            >
                                Create Customer
                            </button>
                        </div>
                    </form>
                </div>

                {/* List Card at Bottom */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mb-4">
                        <h2 className="font-semibold text-base text-slate-800">Customer list</h2>
                        <form onSubmit={handleSearch} className="flex gap-2 max-w-xs w-full">
                            <input
                                name="search"
                                defaultValue={filters.search}
                                placeholder="Search customers..."
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                            />
                            <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer">Search</button>
                        </form>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-slate-100/50 select-none animate-fade-in" onClick={() => handleSort('name')}>
                                        Customer {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-slate-100/50 select-none" onClick={() => handleSort('sales_count')}>
                                        Sales {sortField === 'sales_count' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-slate-100/50 select-none" onClick={() => handleSort('payments_count')}>
                                        Payments {sortField === 'payments_count' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-slate-100/50 select-none" onClick={() => handleSort('opening_balance')}>
                                        Receivable Balance {sortField === 'opening_balance' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="text-right px-4 py-3 select-none">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50/20">
                                        <td className="px-4 py-3">
                                            <Link href={`/customers/${customer.id}`} className="font-semibold text-slate-800 hover:text-emerald-700 hover:underline">{customer.name}</Link>
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{customer.code}</p>
                                        </td>
                                        <td className="text-slate-600 font-medium">{customer.sales_count}</td>
                                        <td className="text-slate-600 font-medium">{customer.payments_count}</td>
                                        <td className="font-bold text-slate-800">{money(customer.ledger_balance ?? 0)}</td>
                                        <td className="text-right px-4 py-2">
                                            <div className="flex justify-end gap-1.5">
                                                <Link
                                                    href={`/customers/${customer.id}`}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    View Details
                                                </Link>
                                                <Link
                                                    href={`/customers/${customer.id}`}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                                                >
                                                    Record Payment
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {customers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                                            No customers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function money(value) {
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
