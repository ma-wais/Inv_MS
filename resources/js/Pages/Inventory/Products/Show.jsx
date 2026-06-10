import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Show({ product, units }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout title={product.name}>
            <Head title={product.name} />

            {flash.status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.status}</div>}

            <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm capitalize text-slate-500">{product.product_type}</p>
                            <h2 className="mt-1 text-2xl font-bold">{product.name}</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                {product.category?.name ?? 'Uncategorized'} · {product.brand?.name ?? 'No brand'} · {product.base_unit.symbol}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {product.track_batches && <Badge>Batch tracked</Badge>}
                            {product.track_expiry && <Badge>Expiry tracked</Badge>}
                        </div>
                    </div>

                    <h3 className="mt-8 font-semibold">Variants</h3>
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
                                <tr><th className="py-3">Variant</th><th>SKU / Barcode</th><th>Prices</th><th>Stock</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {product.variants.map((variant) => (
                                    <tr key={variant.id}>
                                        <td className="py-4 font-medium">{variant.name}</td>
                                        <td><p>{variant.sku}</p><p className="text-xs text-slate-400">{variant.barcodes[0]?.barcode ?? 'No barcode'}</p></td>
                                        <td><p>Sale: {money(variant.sale_price)}</p><p className="text-xs text-slate-400">Cost: {money(variant.purchase_price)}</p></td>
                                        <td className="font-semibold">{quantity(variant.stock_balances.reduce((sum, row) => sum + Number(row.quantity), 0))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <VariantForm productId={product.id} />
                    <ConversionForm productId={product.id} units={units} conversions={product.unit_conversions} />
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

function VariantForm({ productId }) {
    const form = useForm({ name: '', sku: '', barcode: '', purchase_price: '', sale_price: '', reorder_level: '0' });
    return (
        <Card title="Add variant">
            <form onSubmit={(e) => post(e, form, `/products/${productId}/variants`)} className="space-y-3">
                {['name', 'sku', 'barcode', 'purchase_price', 'sale_price', 'reorder_level'].map((field) => (
                    <label key={field} className="block text-sm font-medium capitalize">
                        {field.replaceAll('_', ' ')}
                        <input type={field.includes('price') || field === 'reorder_level' ? 'number' : 'text'} step="any" value={form.data[field]} onChange={(e) => form.setData(field, e.target.value)} className={inputClass} />
                        {form.errors[field] && <span className="mt-1 block text-xs text-red-600">{form.errors[field]}</span>}
                    </label>
                ))}
                <Button form={form}>Add variant</Button>
            </form>
        </Card>
    );
}

function ConversionForm({ productId, units, conversions }) {
    const form = useForm({ unit_id: '', base_quantity: '', barcode: '' });
    return (
        <Card title="Unit conversions">
            <div className="mb-4 space-y-2">
                {conversions.map((conversion) => <p key={conversion.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">1 {conversion.unit.symbol} = {quantity(conversion.base_quantity)} base units</p>)}
            </div>
            <form onSubmit={(e) => post(e, form, `/products/${productId}/unit-conversions`)} className="space-y-3">
                <select value={form.data.unit_id} onChange={(e) => form.setData('unit_id', e.target.value)} className={inputClass}>
                    <option value="">Select alternate unit</option>
                    {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>)}
                </select>
                <input type="number" step="any" placeholder="Base quantity" value={form.data.base_quantity} onChange={(e) => form.setData('base_quantity', e.target.value)} className={inputClass} />
                <input placeholder="Optional barcode" value={form.data.barcode} onChange={(e) => form.setData('barcode', e.target.value)} className={inputClass} />
                {Object.values(form.errors)[0] && <p className="text-xs text-red-600">{Object.values(form.errors)[0]}</p>}
                <Button form={form}>Add conversion</Button>
            </form>
        </Card>
    );
}

function Card({ title, children }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-4 font-semibold">{title}</h3>{children}</div>; }
function Badge({ children }) { return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{children}</span>; }
function Button({ form, children }) { return <button disabled={form.processing} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{children}</button>; }
function post(event, form, url) { event.preventDefault(); form.post(url, { preserveScroll: true, onSuccess: () => form.reset() }); }
function money(value) { return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function quantity(value) { return Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 }); }
const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500';
