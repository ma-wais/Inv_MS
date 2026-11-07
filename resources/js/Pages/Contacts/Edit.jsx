import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../Components/FloatingInput';
import PhoneInput from '../../Components/PhoneInput';
import CnicInput from '../../Components/CnicInput';

export default function Edit({ kind, contact, has_history }) {
    const customer = kind === 'customers';
    const noun = customer ? 'customer' : 'supplier';
    const form = useForm({
        name: contact.name, contact_person: contact.contact_person || '', email: contact.email || '',
        phone: contact.phone || '', cnic: contact.cnic || '', address: contact.address || '',
        credit_limit: contact.credit_limit || '0', tax_number: contact.tax_number || '',
        opening_balance: contact.opening_balance || '0', notes: contact.notes || '', is_active: contact.is_active,
    });
    return <AuthenticatedLayout title={`Edit ${noun}`}>
        <Head title={`Edit ${contact.name}`} />
        <form onSubmit={event => { event.preventDefault(); form.put(`/${kind}/${contact.id}`); }} className="mx-auto max-w-4xl space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <div><h2 className="text-xl font-semibold">{contact.name}</h2><p className="mt-1 text-sm text-muted">Update {noun} details and contact information.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
                <FloatingInput label="Name" required value={form.data.name} onChange={e => form.setData('name', e.target.value)} error={form.errors.name} />
                <FloatingInput label="Contact person" value={form.data.contact_person} onChange={e => form.setData('contact_person', e.target.value)} error={form.errors.contact_person} />
                <FloatingInput label="Email address" type="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} error={form.errors.email} />
                <PhoneInput value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} error={form.errors.phone} />
                <CnicInput value={form.data.cnic} onChange={e => form.setData('cnic', e.target.value)} error={form.errors.cnic} />
                {customer ? <FloatingInput type="number" min="0" step="0.01" label="Credit limit (0 = unlimited)" value={form.data.credit_limit} onChange={e => form.setData('credit_limit', e.target.value)} error={form.errors.credit_limit} />
                    : <FloatingInput label="Tax number" value={form.data.tax_number} onChange={e => form.setData('tax_number', e.target.value)} error={form.errors.tax_number} />}
                <FloatingInput type="number" step="0.01" label="Opening balance" disabled={has_history} value={form.data.opening_balance} onChange={e => form.setData('opening_balance', e.target.value)} error={form.errors.opening_balance} />
                <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm"><input type="checkbox" checked={form.data.is_active} onChange={e => form.setData('is_active', e.target.checked)} /> Available for new invoices</label>
            </div>
            {has_history && <p className="text-xs text-muted">Opening balance is locked because this {noun} has transaction history.</p>}
            {['address', 'notes'].map(field => <label key={field} className="block text-sm font-medium capitalize">{field}
                <textarea rows="3" value={form.data[field]} onChange={e => form.setData(field, e.target.value)} className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-emerald-500" />
                {form.errors[field] && <span className="text-xs text-danger-ink">{form.errors[field]}</span>}
            </label>)}
            <div className="flex items-center justify-end gap-3">
                <Link href={`/${kind}/${contact.id}`} className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium">Cancel</Link>
                <button disabled={form.processing} className="rounded-xl bg-action px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{form.processing ? 'Saving…' : 'Save changes'}</button>
            </div>
        </form>
    </AuthenticatedLayout>;
}
