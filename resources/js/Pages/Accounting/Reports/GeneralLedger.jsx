import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function GeneralLedger({ accounts, selectedAccountId, ledger }) {
    function handleAccountChange(e) {
        const id = e.target.value;
        router.get('/reports/general-ledger', { account_id: id }, { preserveState: true });
    }

    return (
        <AuthenticatedLayout title="General Ledger / Cash Book">
            <Head title="General Ledger" />

            <div className="space-y-6">
                {/* Account selector bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Account Statement</h1>
                        <p className="text-xs text-slate-400">Select an account below to view its dynamic journal ledger lines.</p>
                    </div>

                    <div>
                        <select
                            value={selectedAccountId ?? ''}
                            onChange={handleAccountChange}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white min-w-[280px]"
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Ledger entries table */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th>Entry #</th>
                                    <th>Ref Document</th>
                                    <th>Memo / Description</th>
                                    <th className="text-right">Debit</th>
                                    <th className="text-right">Credit</th>
                                    <th className="text-right px-4">Running Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ledger.map((row, index) => (
                                    <tr key={index} className="hover:bg-slate-50/20">
                                        <td className="px-4 py-3 text-slate-500 text-xs">{row.date}</td>
                                        <td className="font-semibold text-slate-800">{row.entry_number}</td>
                                        <td className="text-xs text-slate-400 font-medium">
                                            {row.reference_number ? (
                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono uppercase">
                                                    {row.reference_number}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="text-slate-600 text-xs max-w-xs truncate" title={row.description}>
                                            {row.description ?? '—'}
                                        </td>
                                        <td className="text-right text-slate-800">
                                            {Number(row.debit) > 0 ? money(row.debit) : '—'}
                                        </td>
                                        <td className="text-right text-slate-800">
                                            {Number(row.credit) > 0 ? money(row.credit) : '—'}
                                        </td>
                                        <td className="text-right text-emerald-800 font-bold px-4">
                                            PKR {money(row.balance)}
                                        </td>
                                    </tr>
                                ))}
                                {ledger.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-slate-400" colSpan="7">
                                            No transaction entries for this account yet.
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
    return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
