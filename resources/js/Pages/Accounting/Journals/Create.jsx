import React, { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Create({ accounts }) {
    const form = useForm({
        entry_date: new Date().toISOString().slice(0, 10),
        description: '',
        reference_number: '',
        lines: [
            { account_id: accounts[0]?.id ?? '', debit: '', credit: '', description: '' },
            { account_id: accounts[1]?.id ?? '', debit: '', credit: '', description: '' },
        ],
    });

    const addLine = () => {
        form.setData('lines', [
            ...form.data.lines,
            { account_id: accounts[0]?.id ?? '', debit: '', credit: '', description: '' }
        ]);
    };

    const removeLine = (index) => {
        if (form.data.lines.length <= 2) {
            alert('A journal entry requires at least two lines (Double-Entry).');
            return;
        }
        form.setData('lines', form.data.lines.filter((_, i) => i !== index));
    };

    const setLineData = (index, field, value) => {
        const lines = [...form.data.lines];
        lines[index] = { ...lines[index], [field]: value };
        form.setData('lines', lines);
    };

    // Calculate dynamic totals
    const totals = useMemo(() => {
        let debits = 0.0;
        let credits = 0.0;

        form.data.lines.forEach(line => {
            debits += Number(line.debit || 0.0);
            credits += Number(line.credit || 0.0);
        });

        return {
            debits,
            credits,
            difference: Math.abs(debits - credits),
            isBalanced: Math.abs(debits - credits) < 0.0001 && debits > 0.0
        };
    }, [form.data.lines]);

    function submit(event) {
        event.preventDefault();
        if (!totals.isBalanced) {
            alert('Unbalanced journal entry. Debits must equal credits and must be greater than zero.');
            return;
        }
        form.post('/journals');
    }

    return (
        <AuthenticatedLayout title="New Journal Entry">
            <Head title="New Journal Entry" />

            <form onSubmit={submit} className="space-y-6">
                {/* Header card */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="font-semibold text-slate-800">Header Info</h2>
                    <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="block text-sm font-medium text-slate-700">
                            Entry Date
                            <input 
                                type="date" 
                                required 
                                value={form.data.entry_date} 
                                onChange={(e) => form.setData('entry_date', e.target.value)} 
                                className={inputClass} 
                            />
                            {form.errors.entry_date && <span className="mt-1 block text-xs text-red-600">{form.errors.entry_date}</span>}
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                            Reference Number (Optional)
                            <input 
                                type="text" 
                                value={form.data.reference_number} 
                                onChange={(e) => form.setData('reference_number', e.target.value)} 
                                className={inputClass} 
                                placeholder="e.g. Bank slip, invoice number"
                            />
                            {form.errors.reference_number && <span className="mt-1 block text-xs text-red-600">{form.errors.reference_number}</span>}
                        </label>
                        <label className="block text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                            Entry Narrative/Description
                            <textarea 
                                required
                                value={form.data.description} 
                                onChange={(e) => form.setData('description', e.target.value)} 
                                className={`${inputClass} min-h-16`} 
                                placeholder="Describe the purpose of this adjustment..."
                            />
                            {form.errors.description && <span className="mt-1 block text-xs text-red-600">{form.errors.description}</span>}
                        </label>
                    </div>
                </section>

                {/* Lines card */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-slate-800">Journal Lines</h2>
                        <button 
                            type="button" 
                            onClick={addLine} 
                            className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                            + Add Line
                        </button>
                    </div>

                    {form.errors.lines && <div className="mb-4 text-sm text-red-600 font-semibold">{form.errors.lines}</div>}

                    <div className="space-y-4">
                        {form.data.lines.map((line, index) => (
                            <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-4 lg:grid-cols-12 items-center">
                                {/* Account selector */}
                                <div className="lg:col-span-4">
                                    <select
                                        value={line.account_id}
                                        onChange={(e) => setLineData(index, 'account_id', e.target.value)}
                                        className={inputClass}
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Line description/memo */}
                                <div className="lg:col-span-4">
                                    <input
                                        placeholder="Line narrative (memo)"
                                        value={line.description}
                                        onChange={(e) => setLineData(index, 'description', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                {/* Debit */}
                                <div className="lg:col-span-1.5">
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Debit"
                                        value={line.debit}
                                        onChange={(e) => {
                                            setLineData(index, 'debit', e.target.value);
                                            if (e.target.value) setLineData(index, 'credit', '');
                                        }}
                                        className={inputClass}
                                    />
                                </div>

                                {/* Credit */}
                                <div className="lg:col-span-1.5">
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Credit"
                                        value={line.credit}
                                        onChange={(e) => {
                                            setLineData(index, 'credit', e.target.value);
                                            if (e.target.value) setLineData(index, 'debit', '');
                                        }}
                                        className={inputClass}
                                    />
                                </div>

                                {/* Remove button */}
                                <div className="lg:col-span-1 text-right">
                                    <button
                                        type="button"
                                        onClick={() => removeLine(index)}
                                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals panel */}
                    <div className="mt-6 border-t border-slate-100 pt-4 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex gap-6 text-sm">
                            <div>
                                <span className="text-slate-500 font-medium">Total Debits:</span>
                                <span className="ml-2 font-bold text-slate-800">PKR {totals.debits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 font-medium">Total Credits:</span>
                                <span className="ml-2 font-bold text-slate-800">PKR {totals.credits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="text-right">
                            {totals.isBalanced ? (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">Balanced ✅</span>
                            ) : (
                                <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                    Unbalanced (Diff: PKR {totals.difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}) ❌
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                <div className="flex gap-3">
                    <button 
                        type="submit"
                        disabled={form.processing || !totals.isBalanced} 
                        className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-slate-800 transition-colors"
                    >
                        Post Journal Entry
                    </button>
                    <Link href="/journals" className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white';
