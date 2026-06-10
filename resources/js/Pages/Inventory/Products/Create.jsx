import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Create({ categories, brands, units, warehouses }) {
    const form = useForm({
        name: '',
        category_id: '',
        brand_id: '',
        base_unit_id: units[0]?.id ?? '',
        product_type: 'standard',
        description: '',
        track_batches: false,
        track_expiry: false,
        variant_name: 'Default',
        sku: '',
        barcode: '',
        purchase_price: '',
        sale_price: '',
        reorder_level: '0',
        opening_stock: '0',
        warehouse_id: warehouses[0]?.id ?? '',
    });

    function submit(event) {
        event.preventDefault();
        form.post('/products');
    }

    return (
        <AuthenticatedLayout title="Add product">
            <Head title="Add product" />

            <form onSubmit={submit} className="max-w-5xl space-y-6">
                <Section title="Product details">
                    <Grid>
                        <Field label="Product name" error={form.errors.name}><Input value={form.data.name} onChange={(v) => form.setData('name', v)} /></Field>
                        <Field label="Product type" error={form.errors.product_type}><Select value={form.data.product_type} onChange={(v) => form.setData('product_type', v)} options={[['standard', 'Standard'], ['paint', 'Paint'], ['medicine', 'Medicine']]} /></Field>
                        <Field label="Category" error={form.errors.category_id}><Select value={form.data.category_id} onChange={(v) => form.setData('category_id', v)} options={categories.map((item) => [item.id, item.name])} empty="Uncategorized" /></Field>
                        <Field label="Brand" error={form.errors.brand_id}><Select value={form.data.brand_id} onChange={(v) => form.setData('brand_id', v)} options={brands.map((item) => [item.id, item.name])} empty="No brand" /></Field>
                        <Field label="Base unit" error={form.errors.base_unit_id}><Select value={form.data.base_unit_id} onChange={(v) => form.setData('base_unit_id', v)} options={units.map((item) => [item.id, `${item.name} (${item.symbol})`])} /></Field>
                    </Grid>
                    <label className="mt-5 block text-sm font-medium">Description<textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} className={`${inputClass} min-h-24`} /></label>
                    <div className="mt-5 flex flex-wrap gap-5 text-sm">
                        <Checkbox label="Track batches" checked={form.data.track_batches} onChange={(v) => form.setData('track_batches', v)} />
                        <Checkbox label="Track expiry dates" checked={form.data.track_expiry} onChange={(v) => form.setData('track_expiry', v)} />
                    </div>
                </Section>

                <Section title="First variant and pricing">
                    <Grid>
                        <Field label="Variant name" error={form.errors.variant_name}><Input value={form.data.variant_name} onChange={(v) => form.setData('variant_name', v)} /></Field>
                        <Field label="SKU" error={form.errors.sku}><Input value={form.data.sku} onChange={(v) => form.setData('sku', v)} /></Field>
                        <Field label="Barcode" error={form.errors.barcode}><Input value={form.data.barcode} onChange={(v) => form.setData('barcode', v)} /></Field>
                        <Field label="Purchase price" error={form.errors.purchase_price}><Input type="number" value={form.data.purchase_price} onChange={(v) => form.setData('purchase_price', v)} /></Field>
                        <Field label="Sale price" error={form.errors.sale_price}><Input type="number" value={form.data.sale_price} onChange={(v) => form.setData('sale_price', v)} /></Field>
                        <Field label="Reorder level" error={form.errors.reorder_level}><Input type="number" value={form.data.reorder_level} onChange={(v) => form.setData('reorder_level', v)} /></Field>
                    </Grid>
                </Section>

                <Section title="Opening stock">
                    <p className="mb-5 text-sm text-slate-500">Optional. This creates the first immutable stock-ledger entry.</p>
                    <Grid>
                        <Field label="Opening quantity" error={form.errors.opening_stock}><Input type="number" value={form.data.opening_stock} onChange={(v) => form.setData('opening_stock', v)} /></Field>
                        <Field label="Warehouse" error={form.errors.warehouse_id}><Select value={form.data.warehouse_id} onChange={(v) => form.setData('warehouse_id', v)} options={warehouses.map((item) => [item.id, item.name])} empty="Select warehouse" /></Field>
                    </Grid>
                </Section>

                <div className="flex gap-3">
                    <button disabled={form.processing} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{form.processing ? 'Creating...' : 'Create product'}</button>
                    <Link href="/products" className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold">Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function Section({ title, children }) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-5 text-lg font-semibold">{title}</h2>{children}</section>;
}
function Grid({ children }) { return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>; }
function Field({ label, error, children }) { return <label className="block text-sm font-medium">{label}{children}{error && <span className="mt-1 block text-sm text-red-600">{error}</span>}</label>; }
function Input({ value, onChange, type = 'text' }) { return <input type={type} step={type === 'number' ? 'any' : undefined} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />; }
function Select({ value, onChange, options, empty }) { return <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>{empty !== undefined && <option value="">{empty}</option>}{options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>; }
function Checkbox({ label, checked, onChange }) { return <label className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>; }
const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500';
