import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useEffect } from 'react';
import { formatDate } from '../../../Components/utils';

export default function Show({ returnDoc }) {
    const { flash } = usePage().props;

    function printInvoice() {
        window.print();
    }

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('print') === 'true') {
            window.print();
        }
    }, []);

    return (
        <AuthenticatedLayout title={returnDoc.number}>
            <Head title={returnDoc.number} />

            {flash.status && <div className="mb-5 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">{flash.status}</div>}

            <div className="mb-4 flex items-center gap-3 print:hidden">
                <Link
                    href="/sales/returns"
                    className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors"
                >
                    &larr; Back to Returns
                </Link>
            </div>

            <section className="grid gap-6 xl:grid-cols-3 print:grid-cols-1 print:gap-0">
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm xl:col-span-2 print:border-none print:shadow-none">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-muted">Customer</p>
                            <h2 className="text-2xl font-bold">{returnDoc.customer.name}</h2>
                            <p className="mt-2 text-sm text-muted">Warehouse: {returnDoc.warehouse.name}</p>
                        </div>
                        <div className="rounded-xl bg-surface-muted px-4 py-3 text-right print:bg-surface print:border print:border-line-soft">
                            <p className="text-xs uppercase text-subtle">Status</p>
                            <p className="text-lg font-semibold capitalize">{returnDoc.status ?? 'posted'}</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-2">
                        <Metric label="Return total" value={`PKR ${money(returnDoc.total)}`} />
                        <Metric label="Original sale invoice" value={returnDoc.sale?.number ?? '—'} />
                        <Metric label="Return date" value={formatDate(returnDoc.return_date)} />
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase text-muted">
                                <tr>
                                    <th className="px-4 py-3">Item</th>
                                    <th>Qty Returned</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft">
                                {returnDoc.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{item.variant.product.name}</p>
                                            <p className="text-xs text-subtle">{item.variant.sku}</p>
                                        </td>
                                        <td>{qty(item.quantity)} {item.variant.product.base_unit.symbol}</td>
                                        <td>PKR {money(item.unit_price)}</td>
                                        <td>PKR {money(item.line_total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 print:hidden">
                        <button onClick={printInvoice} className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold hover:bg-surface-muted transition-colors cursor-pointer">
                            Print Receipt
                        </button>
                    </div>
                </div>

                <div className="space-y-6 print:hidden">
                    <Card title="Return details">
                        <Row label="Return no." value={returnDoc.number} />
                        <Row label="Return date" value={formatDate(returnDoc.return_date)} />
                        {returnDoc.notes && <div className="mt-4 border-t border-line-soft pt-3 text-xs text-muted font-medium">Notes: {returnDoc.notes}</div>}
                    </Card>
                </div>
            </section>

            {/* Custom Print CSS */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body {
                        background-color: white !important;
                        color: black !important;
                    }
                    header, aside, .print\\:hidden {
                        display: none !important;
                    }
                    main {
                        padding: 0 !important;
                    }
                }
            `}} />
        </AuthenticatedLayout>
    );
}

function Card({ title, children }) { return <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm"><h3 className="font-semibold">{title}</h3><div className="mt-4 space-y-2">{children}</div></div>; }
function Row({ label, value }) { return <div className="flex items-center justify-between gap-3 text-sm"><span className="text-muted">{label}</span><span className="font-medium">{value}</span></div>; }
function Metric({ label, value }) { return <div className="rounded-xl bg-surface-muted px-4 py-3"><p className="text-xs uppercase text-subtle">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function money(value) { return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function qty(value) { return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 }); }
