import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function Setup({ categories, brands, units }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout title="Inventory setup">
            <Head title="Inventory setup" />

            {flash.status && (
                <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {flash.status}
                </div>
            )}

            <section className="grid gap-6 xl:grid-cols-3">
                <SetupCard title="Categories" description="Organize products into nested groups.">
                    <CategoryForm categories={categories} />
                    <ItemList items={categories.map((item) => ({ ...item, meta: item.parent?.name }))} />
                </SetupCard>

                <SetupCard title="Brands" description="Manufacturers and commercial brands.">
                    <SimpleForm endpoint="/inventory/brands" fields={{ name: '' }} button="Add brand" />
                    <ItemList items={brands} />
                </SetupCard>

                <SetupCard title="Units" description="Pieces, liters, kilograms, boxes, and more.">
                    <UnitForm />
                    <ItemList items={units.map((item) => ({ ...item, meta: item.symbol }))} />
                </SetupCard>
            </section>
        </AuthenticatedLayout>
    );
}

function SetupCard({ title, description, children }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
            {children}
        </div>
    );
}

function CategoryForm({ categories }) {
    const form = useForm({ name: '', parent_id: '', description: '' });

    return (
        <form onSubmit={(e) => submit(e, form, '/inventory/categories')} className="mt-5 space-y-3">
            <input placeholder="Category name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={inputClass} />
            <select value={form.data.parent_id} onChange={(e) => form.setData('parent_id', e.target.value)} className={inputClass}>
                <option value="">No parent</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <FormError errors={form.errors} />
            <SubmitButton form={form}>Add category</SubmitButton>
        </form>
    );
}

function UnitForm() {
    const form = useForm({ name: '', symbol: '', allows_decimal: false });

    return (
        <form onSubmit={(e) => submit(e, form, '/inventory/units')} className="mt-5 space-y-3">
            <input placeholder="Unit name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={inputClass} />
            <input placeholder="Symbol, e.g. L or pc" value={form.data.symbol} onChange={(e) => form.setData('symbol', e.target.value)} className={inputClass} />
            <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.data.allows_decimal} onChange={(e) => form.setData('allows_decimal', e.target.checked)} />
                Allow decimal quantities
            </label>
            <FormError errors={form.errors} />
            <SubmitButton form={form}>Add unit</SubmitButton>
        </form>
    );
}

function SimpleForm({ endpoint, fields, button }) {
    const form = useForm(fields);

    return (
        <form onSubmit={(e) => submit(e, form, endpoint)} className="mt-5 space-y-3">
            <input placeholder="Name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={inputClass} />
            <FormError errors={form.errors} />
            <SubmitButton form={form}>{button}</SubmitButton>
        </form>
    );
}

function ItemList({ items }) {
    return (
        <div className="mt-6 max-h-80 space-y-2 overflow-auto">
            {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span>{item.name}</span>
                    {item.meta && <span className="text-xs text-slate-400">{item.meta}</span>}
                </div>
            ))}
            {items.length === 0 && <p className="text-sm text-slate-400">Nothing added yet.</p>}
        </div>
    );
}

function FormError({ errors }) {
    const first = Object.values(errors)[0];
    return first ? <p className="text-sm text-red-600">{first}</p> : null;
}

function SubmitButton({ form, children }) {
    return <button disabled={form.processing} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{children}</button>;
}

function submit(event, form, endpoint) {
    event.preventDefault();
    form.post(endpoint, { preserveScroll: true, onSuccess: () => form.reset() });
}

const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500';
