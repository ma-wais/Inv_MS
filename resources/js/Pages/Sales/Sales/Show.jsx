import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useEffect } from 'react';
import { formatDate } from '../../../Components/utils';

export default function Show({ sale, accounts }) {
    const { flash } = usePage().props;
    const postForm = useForm();

    function postSale() {
        postForm.post(`/sales/${sale.id}/post`);
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
        <AuthenticatedLayout title={sale.number}>
            <Head title={sale.number} />

            {flash.status && <div className="mb-5 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">{flash.status}</div>}

            <section className="grid gap-6 xl:grid-cols-3 print:grid-cols-1 print:gap-0">
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm xl:col-span-2 print:border-none print:shadow-none">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-muted">Customer</p>
                            <h2 className="text-2xl font-bold">{sale.customer.name}</h2>
                            <p className="mt-2 text-sm text-muted">Warehouse: {sale.warehouse.name}</p>
                        </div>
                        <div className="rounded-xl bg-surface-muted px-4 py-3 text-right print:bg-surface print:border print:border-line-soft">
                            <p className="text-xs uppercase text-subtle">Status</p>
                            <p className="text-lg font-semibold capitalize">{sale.status}</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
                        <Metric label="Subtotal" value={money(sale.subtotal)} />
                        <Metric label="Grand total" value={money(sale.grand_total)} />
                        <Metric label="Paid total" value={money(sale.paid_total)} />
                        <Metric label="Outstanding" value={money(sale.outstanding)} />
                        <Metric label="Returned total" value={money(sale.returned_total)} />
                        <Metric label="Credit balance" value={money(sale.credit_balance)} />
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase text-muted"><tr><th className="px-4 py-3">Item</th><th>Qty</th><th>Returned</th><th>Price</th><th>Total</th></tr></thead>
                            <tbody className="divide-y divide-line-soft">
                                {sale.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{item.variant.product.name}</p>
                                            <p className="text-xs text-subtle">{item.variant.sku}</p>
                                        </td>
                                        <td>{qty(item.quantity)} {item.variant.product.base_unit?.symbol ?? 'pc'}</td>
                                        <td>{qty(item.returned_quantity)}</td>
                                        <td>{money(item.unit_price)}</td>
                                        <td>{money(item.line_total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 print:hidden">
                        <button onClick={printInvoice} className="rounded-xl bg-action px-5 py-3 text-sm font-semibold text-white">
                            Print Invoice
                        </button>
                        {sale.status === 'posted' && (
                            <Link href={`/sales/${sale.id}/returns/create`} className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold hover:bg-surface-muted">
                                Return items
                            </Link>
                        )}
                    </div>
                </div>

                <div className="space-y-6 print:hidden">
                    <Card title="Invoice Details">
                        <Row label="Sale No." value={sale.number} />
                        <Row label="Ref. Invoice" value={sale.invoice_number ?? '—'} />
                        <Row label="Sale date" value={formatDate(sale.sale_date)} />
                        <Row label="Notes" value={sale.notes ?? '—'} />
                    </Card>
                    <Card title="POS Context">
                        <p className="text-sm text-muted">
                            Sales are registered directly via POS. Returns restock the items and update customer ledger balances.
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
