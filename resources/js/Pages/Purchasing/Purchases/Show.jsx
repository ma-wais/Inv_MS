import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useEffect } from 'react';
import { formatDate } from '../../../Components/utils';

export default function Show({ purchase, accounts }) {
    const { flash } = usePage().props;
    const receive = useForm();

    function postReceive() {
        receive.post(`/purchases/${purchase.id}/receive`);
    }

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
        <AuthenticatedLayout title={purchase.number}>
            <Head title={purchase.number} />

            {flash.status && <div className="mb-5 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">{flash.status}</div>}

            <section className="grid gap-6 xl:grid-cols-3 print:grid-cols-1 print:gap-0">
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm xl:col-span-2 print:border-none print:shadow-none">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-muted">Supplier</p>
                            <h2 className="text-2xl font-bold">{purchase.supplier.name}</h2>
                            <p className="mt-2 text-sm text-muted">Warehouse: {purchase.warehouse.name}</p>
                        </div>
                        <div className="rounded-xl bg-surface-muted px-4 py-3 text-right print:bg-surface print:border print:border-line-soft">
                            <p className="text-xs uppercase text-subtle">Status</p>
                            <p className="text-lg font-semibold capitalize">{purchase.status}</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
                        <Metric label="Subtotal" value={money(purchase.subtotal)} />
                        <Metric label="Grand total" value={money(purchase.grand_total)} />
                        <Metric label="Paid total" value={money(purchase.paid_total)} />
                        <Metric label="Outstanding" value={money(purchase.outstanding)} />
                        <Metric label="Returned total" value={money(purchase.returned_total)} />
                        <Metric label="Credit balance" value={money(purchase.credit_balance)} />
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase text-muted"><tr><th className="px-4 py-3">Item</th><th>Qty</th><th>Received</th><th>Cost</th><th>Total</th></tr></thead>
                            <tbody className="divide-y divide-line-soft">
                                {purchase.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{item.variant.product.name}</p>
                                            <p className="text-xs text-subtle">{item.variant.sku}</p>
                                        </td>
                                        <td>{qty(item.quantity)} {item.variant.product.base_unit.symbol}</td>
                                        <td>{qty(item.received_quantity)}</td>
                                        <td>{money(item.unit_cost)}</td>
                                        <td>{money(item.line_total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 print:hidden">
                        <button 
                            onClick={postReceive} 
                            disabled={receive.processing || !['draft', 'ordered'].includes(purchase.status)} 
                            className="rounded-xl bg-action px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {['posted', 'received'].includes(purchase.status) ? 'Already received & posted' : 'Receive and post stock'}
                        </button>
                        {purchase.status === 'posted' && (
                            <Link href={`/purchases/${purchase.id}/returns/create`} className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold hover:bg-surface-muted transition-colors">
                                Create return
                            </Link>
                        )}
                        <button onClick={printInvoice} className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold hover:bg-surface-muted transition-colors">
                            Print Receipt
                        </button>
                    </div>
                </div>

                <div className="space-y-6 print:hidden">
                    <Card title="Document details">
                        <Row label="Purchase no." value={purchase.number} />
                        <Row label="Supplier invoice" value={purchase.supplier_invoice_number ?? '—'} />
                        <Row label="Purchase date" value={formatDate(purchase.purchase_date)} />
                        <Row label="Due date" value={formatDate(purchase.due_date)} />
                    </Card>
                    <Card title="Ledger note">
                        <p className="text-sm text-muted">
                            Receiving posts stock and accounting entries. Returns reduce supplier balances and restore the invoice's allocated cost.
                        </p>
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

