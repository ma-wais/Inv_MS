import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import Pagination from '../../../Components/Pagination';
import { formatDate } from '../../../Components/utils';

export default function Index({ entries }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout title="Journal Entries">
            <Head title="Journal Entries" />
            {flash.status && <div className="mb-5 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">{flash.status}</div>}

            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-foreground">General Journal</h1>
                <Link href="/journals/create" className="rounded-xl bg-action px-5 py-3 text-sm font-semibold text-white">Create Journal Entry</Link>
            </div>

            <div className="space-y-6">
                {entries.data.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-line bg-surface shadow-sm overflow-hidden">
                        {/* Entry header */}
                        <div className="bg-surface-muted px-5 py-4 flex flex-wrap justify-between items-center border-b border-line-soft gap-3">
                            <div>
                                <span className="font-bold text-foreground text-base">{entry.number}</span>
                                <span className="text-xs text-subtle ml-3">{formatDate(entry.entry_date)}</span>
                                {entry.is_system && <span className="ml-3 text-[10px] bg-surface-hover text-foreground font-semibold px-2 py-0.5 rounded uppercase">Auto-posted</span>}
                            </div>
                            <div className="text-sm text-muted font-medium">
                                Created by: {entry.creator?.name ?? 'System'}
                                {entry.reference_number && <span className="ml-3 font-semibold bg-success-soft text-success-ink px-2.5 py-0.5 rounded">Ref: {entry.reference_number}</span>}
                            </div>
                        </div>

                        {/* Entry lines */}
                        <div className="p-5">
                            <p className="text-sm text-muted mb-4 font-medium italic">"{entry.description ?? 'No description provided.'}"</p>
                            
                            <table className="w-full text-left text-sm">
                                <thead className="bg-surface-muted text-xs uppercase text-subtle">
                                    <tr>
                                        <th className="px-4 py-2">Account</th>
                                        <th>Memo / Line Description</th>
                                        <th className="text-right">Debit</th>
                                        <th className="text-right px-4">Credit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line-soft">
                                    {entry.lines.map((line) => (
                                        <tr key={line.id} className="hover:bg-surface-muted/20">
                                            <td className="px-4 py-2.5 font-semibold text-foreground">
                                                {line.account.code} - {line.account.name}
                                            </td>
                                            <td className="text-muted text-xs">
                                                {line.description ?? '—'}
                                            </td>
                                            <td className="text-right text-foreground font-medium">
                                                {Number(line.debit) > 0 ? money(line.debit) : '—'}
                                            </td>
                                            <td className="text-right text-foreground font-medium px-4">
                                                {Number(line.credit) > 0 ? money(line.credit) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {entries.data.length === 0 && (
                    <div className="bg-surface rounded-2xl border border-line p-8 text-center text-subtle">
                        <span className="text-4xl">📄</span>
                        <p className="mt-2 text-sm">No journal entries recorded yet.</p>
                    </div>
                )}
            </div>
            <Pagination links={entries.links} className="mt-6" />
        </AuthenticatedLayout>
    );
}

function money(value) {
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
