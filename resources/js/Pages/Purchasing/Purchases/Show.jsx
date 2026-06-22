import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useEffect } from 'react';

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

            {flash.status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.status}</div>}

            <section className="grid gap-6 xl:grid-cols-3 print:grid-cols-1 print:gap-0">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2 print:border-none print:shadow-none">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-slate-500">Supplier</p>
                            <h2 className="text-2xl font-bold">{purchase.supplier.name}</h2>
                            <p className="mt-2 text-sm text-slate-500">Warehouse: {purchase.warehouse.name}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-right print:bg-white print:border print:border-slate-100">
                            <p className="text-xs uppercase text-slate-400">Status</p>
                            <p className="text-lg font-semibold capitalize">{purchase.status}</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
                        <Metric label="Subtotal" value={money(purchase.subtotal)} />
                        <Metric label="Grand total" value={money(purchase.grand_total)} />
                        <Metric label="Paid total" value={money(purchase.paid_total)} />
                        <Metric label="Outstanding" value={money(purchase.grand_total - purchase.paid_total)} />
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Item</th><th>Qty</th><th>Received</th><th>Cost</th><th>Total</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {purchase.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{item.variant.product.name}</p>
                                            <p className="text-xs text-slate-400">{item.variant.sku}</p>
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
                            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {['posted', 'received'].includes(purchase.status) ? 'Already received & posted' : 'Receive and post stock'}
                        </button>
                        {purchase.status === 'posted' && (
                            <Link href={`/purchases/${purchase.id}/returns/create`} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                Create return
                            </Link>
                        )}
                        <button onClick={printInvoice} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-50 transition-colors">
                            Print Receipt
                        </button>
                    </div>
                </div>

                <div className="space-y-6 print:hidden">
                    <Card title="Document details">
                        <Row label="Purchase no." value={purchase.number} />
                        <Row label="Supplier invoice" value={purchase.supplier_invoice_number ?? '—'} />
                        <Row label="Purchase date" value={purchase.purchase_date} />
                        <Row label="Due date" value={purchase.due_date ?? '—'} />
                    </Card>
                    <Card title="Ledger note">
                        <p className="text-sm text-slate-500">
                            Phase 3 keeps purchasing operational. Phase 5 will connect these transactions to the formal chart of accounts and journal entries.
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

function Card({ title, children }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold">{title}</h3><div className="mt-4 space-y-2">{children}</div></div>; }
function Row({ label, value }) { return <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">{label}</span><span className="font-medium">{value}</span></div>; }
function Metric({ label, value }) { return <div className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-xs uppercase text-slate-400">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function money(value) { return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function qty(value) { return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 }); }

