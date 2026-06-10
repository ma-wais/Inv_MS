import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Index({ balances, movements, variants, warehouses, lowStock }) {
    const { flash } = usePage().props;
    const form = useForm({ warehouse_id: warehouses[0]?.id ?? '', product_variant_id: '', quantity: '', note: '' });

    function submit(event) {
        event.preventDefault();
        form.post('/stock/adjustments', { preserveScroll: true, onSuccess: () => form.reset('quantity', 'note') });
    }

    return (
        <AuthenticatedLayout title="Stock ledger">
            <Head title="Stock ledger" />
            {flash.status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.status}</div>}

            {lowStock.length > 0 && (
                <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <h2 className="font-semibold text-amber-900">Low-stock alerts</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {lowStock.map((variant) => (
                            <div key={variant.id} className="rounded-xl bg-white/70 px-3 py-2 text-sm">
                                <p className="font-medium">{variant.product.name}</p>
                                <p className="text-xs text-amber-800">{variant.sku}: {qty(variant.stock_quantity ?? 0)} / reorder {qty(variant.reorder_level)} {variant.product.base_unit.symbol}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
                    <div className="border-b border-slate-100 p-5"><h2 className="font-semibold">Current balances</h2><p className="mt-1 text-sm text-slate-500">Low-stock rows are highlighted.</p></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Product</th><th>Warehouse</th><th>Batch</th><th>Quantity</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {balances.map((balance) => {
                                    const low = Number(balance.quantity) <= Number(balance.variant.reorder_level);
                                    return <tr key={balance.id} className={low ? 'bg-amber-50' : ''}>
                                        <td className="px-5 py-4"><p className="font-medium">{balance.variant.product.name}</p><p className="text-xs text-slate-400">{balance.variant.sku}</p></td>
                                        <td>{balance.warehouse.name}</td><td>{balance.batch?.batch_number ?? 'No batch'}</td>
                                        <td className="font-semibold">{qty(balance.quantity)} {balance.variant.product.base_unit.symbol}{low && <span className="ml-2 text-xs text-amber-700">Low</span>}</td>
                                    </tr>;
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold">Manual adjustment</h2>
                    <p className="mt-1 text-sm text-slate-500">Use positive quantities to add and negative quantities to remove stock.</p>
                    <form onSubmit={submit} className="mt-5 space-y-3">
                        <Select value={form.data.warehouse_id} onChange={(v) => form.setData('warehouse_id', v)} options={warehouses.map((item) => [item.id, item.name])} empty="Select warehouse" />
                        <Select value={form.data.product_variant_id} onChange={(v) => form.setData('product_variant_id', v)} options={variants.map((item) => [item.id, `${item.product.name} · ${item.sku}`])} empty="Select product variant" />
                        <input type="number" step="any" placeholder="Quantity, e.g. -2 or 5" value={form.data.quantity} onChange={(e) => form.setData('quantity', e.target.value)} className={inputClass} />
                        <textarea placeholder="Reason for adjustment" value={form.data.note} onChange={(e) => form.setData('note', e.target.value)} className={`${inputClass} min-h-24`} />
                        {Object.values(form.errors)[0] && <p className="text-sm text-red-600">{Object.values(form.errors)[0]}</p>}
                        <button disabled={form.processing} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Record adjustment</button>
                    </form>
                </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5"><h2 className="font-semibold">Recent movements</h2></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Date</th><th>Product</th><th>Warehouse</th><th>Type</th><th>Quantity</th><th>Note</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {movements.map((movement) => <tr key={movement.id}><td className="px-5 py-4">{new Date(movement.occurred_at).toLocaleString()}</td><td>{movement.variant.product.name}<p className="text-xs text-slate-400">{movement.variant.sku}</p></td><td>{movement.warehouse.name}</td><td className="capitalize">{movement.type.replaceAll('_', ' ')}</td><td className={`font-semibold ${Number(movement.quantity) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{qty(movement.quantity)}</td><td className="max-w-xs text-slate-500">{movement.note}</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

function Select({ value, onChange, options, empty }) { return <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}><option value="">{empty}</option>{options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>; }
function qty(value) { return Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 }); }
const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500';
