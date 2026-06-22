import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../../Components/FloatingInput';
import SearchableSelect from '../../../Components/SearchableSelect';

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

            <form onSubmit={submit} className="space-y-4">
                {/* Header card */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-slate-800 text-base mb-4">Header Info</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FloatingInput
                            label="Entry Date"
                            type="date"
                            value={form.data.entry_date}
                            onChange={(e) => form.setData('entry_date', e.target.value)}
                            required
                            error={form.errors.entry_date}
                        />
                        <FloatingInput
                            label="Reference Number"
                            value={form.data.reference_number}
                            onChange={(e) => form.setData('reference_number', e.target.value)}
                            placeholder="e.g. Bank slip, invoice number"
                            error={form.errors.reference_number}
                        />
                        
                        {/* Compact Description Textarea */}
                        <div className="relative w-full sm:col-span-2 lg:col-span-3">
                            <textarea
                                id="description"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                placeholder=" "
                                required
                                className="peer block w-full rounded-xl border border-slate-200 bg-white px-4 pb-2 pt-5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 min-h-16"
                            />
                            <label
                                htmlFor="description"
                                className="absolute left-4 top-2 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-xs text-slate-400 duration-150 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
                            >
                                Entry Narrative/Description
                            </label>
                            {form.errors.description && <span className="mt-1 block text-xs text-red-600">{form.errors.description}</span>}
                        </div>
                    </div>
                </section>

                {/* Lines card */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-slate-800 text-base">Journal Lines</h2>
                        <button
                            type="button"
                            onClick={addLine}
                            className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            + Add Line
                        </button>
                    </div>

                    {form.errors.lines && <div className="mb-4 text-sm text-red-600 font-semibold">{form.errors.lines}</div>}

                    <div className="space-y-3">
                        {form.data.lines.map((line, index) => (
                            <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-4 lg:grid-cols-12 items-center bg-slate-50/30">
                                {/* Account selector */}
                                <div className="lg:col-span-4">
                                    <SearchableSelect
                                        label="Account"
                                        value={line.account_id}
                                        onChange={(e) => setLineData(index, 'account_id', e.target.value)}
                                        options={accounts.map(acc => ({ value: acc.id, label: `${acc.code} - ${acc.name}` }))}
                                        required
                                    />
                                </div>

                                {/* Line description/memo */}
                                <div className="lg:col-span-4">
                                    <FloatingInput
                                        label="Line narrative (memo)"
                                        value={line.description}
                                        onChange={(e) => setLineData(index, 'description', e.target.value)}
                                    />
                                </div>

                                {/* Debit */}
                                <div className="lg:col-span-1.5">
                                    <FloatingInput
                                        label="Debit"
                                        type="number"
                                        step="any"
                                        value={line.debit}
                                        onChange={(e) => {
                                            setLineData(index, 'debit', e.target.value);
                                            if (e.target.value) setLineData(index, 'credit', '');
                                        }}
                                    />
                                </div>

                                {/* Credit */}
                                <div className="lg:col-span-1.5">
                                    <FloatingInput
                                        label="Credit"
                                        type="number"
                                        step="any"
                                        value={line.credit}
                                        onChange={(e) => {
                                            setLineData(index, 'credit', e.target.value);
                                            if (e.target.value) setLineData(index, 'debit', '');
                                        }}
                                    />
                                </div>

                                {/* Remove button */}
                                <div className="lg:col-span-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeLine(index)}
                                        className="rounded-lg border border-red-200 p-2.5 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                        title="Remove Line"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals panel */}
                    <div className="mt-4 border-t border-slate-100 pt-4 flex flex-wrap justify-between items-center gap-4">
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
                        className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        Post Journal Entry
                    </button>
                    <Link
                        href="/journals"
                        className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
