import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Create({ suppliers, warehouses, variants }) {
    const form = useForm({
        supplier_id: suppliers[0]?.id ?? '',
        warehouse_id: warehouses[0]?.id ?? '',
        supplier_invoice_number: '',
        purchase_date: new Date().toISOString().slice(0, 10),
        due_date: '',
        status: 'draft',
        discount_total: '0',
        tax_total: '0',
        shipping_total: '0',
        notes: '',
        items: [
            { product_variant_id: variants[0]?.id ?? '', quantity: '', unit_cost: variants[0]?.purchase_price ?? '', batch_number: '', expires_at: '' },
        ],
    });

    function submit(event) {
        event.preventDefault();
        form.post('/purchases');
    }

    function setItem(index, field, value) {
        const items = [...form.data.items];
        items[index] = { ...items[index], [field]: value };
        form.setData('items', items);
    }

    return (
        <AuthenticatedLayout title="New purchase">
            <Head title="New purchase" />

            <form onSubmit={submit} className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="font-semibold">Header</h2>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Supplier"><Select value={form.data.supplier_id} onChange={(v) => form.setData('supplier_id', v)} options={suppliers.map((item) => [item.id, item.name])} /></Field>
                        <Field label="Warehouse"><Select value={form.data.warehouse_id} onChange={(v) => form.setData('warehouse_id', v)} options={warehouses.map((item) => [item.id, item.name])} /></Field>
                        <Field label="Supplier invoice #"><Input value={form.data.supplier_invoice_number} onChange={(v) => form.setData('supplier_invoice_number', v)} /></Field>
                        <Field label="Purchase date"><Input type="date" value={form.data.purchase_date} onChange={(v) => form.setData('purchase_date', v)} /></Field>
                        <Field label="Due date"><Input type="date" value={form.data.due_date} onChange={(v) => form.setData('due_date', v)} /></Field>
                        <Field label="Status"><Select value={form.data.status} onChange={(v) => form.setData('status', v)} options={[['draft', 'Draft'], ['ordered', 'Ordered'], ['received', 'Received and post stock']]} /></Field>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Items</h2>
                        <button type="button" onClick={() => form.setData('items', [...form.data.items, { product_variant_id: variants[0]?.id ?? '', quantity: '', unit_cost: '', batch_number: '', expires_at: '' }])} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Add line</button>
                    </div>

                    <div className="mt-5 space-y-4">
                        {form.data.items.map((item, index) => (
                            <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-4 lg:grid-cols-6">
                                <Select value={item.product_variant_id} onChange={(v) => setItem(index, 'product_variant_id', v)} options={variants.map((variant) => [variant.id, `${variant.product.name} · ${variant.sku}`])} />
                                <Input type="number" step="any" value={item.quantity} onChange={(v) => setItem(index, 'quantity', v)} placeholder="Qty" />
                                <Input type="number" step="any" value={item.unit_cost} onChange={(v) => setItem(index, 'unit_cost', v)} placeholder="Cost" />
                                <Input value={item.batch_number} onChange={(v) => setItem(index, 'batch_number', v)} placeholder="Batch" />
                                <Input type="date" value={item.expires_at} onChange={(v) => setItem(index, 'expires_at', v)} placeholder="Expiry" />
                                <button type="button" onClick={() => form.setData('items', form.data.items.filter((_, i) => i !== index))} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">Remove</button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-3">
                        <Field label="Discount total"><Input type="number" step="any" value={form.data.discount_total} onChange={(v) => form.setData('discount_total', v)} /></Field>
                        <Field label="Tax total"><Input type="number" step="any" value={form.data.tax_total} onChange={(v) => form.setData('tax_total', v)} /></Field>
                        <Field label="Shipping total"><Input type="number" step="any" value={form.data.shipping_total} onChange={(v) => form.setData('shipping_total', v)} /></Field>
                    </div>

                    <label className="mt-5 block text-sm font-medium">
                        Notes
                        <textarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} className={`${inputClass} min-h-24`} />
                    </label>
                </section>

                <div className="flex gap-3">
                    <button disabled={form.processing} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">Save purchase</button>
                    <Link href="/purchases" className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold">Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function Field({ label, children }) { return <label className="block text-sm font-medium">{label}{children}</label>; }
function Input({ value, onChange, type = 'text', step, placeholder }) { return <input type={type} step={step} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />; }
function Select({ value, onChange, options }) { return <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>{options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>; }
const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500';
