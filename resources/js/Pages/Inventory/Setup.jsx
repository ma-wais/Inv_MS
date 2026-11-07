import { Head, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../Components/FloatingInput';
import SearchableSelect from '../../Components/SearchableSelect';
import React, { useState } from 'react';

export default function Setup({ categories, brands, units }) {
    const { flash, errors } = usePage().props;

    const [editingCategory, setEditingCategory] = useState(null);
    const [editingBrand, setEditingBrand] = useState(null);
    const [editingUnit, setEditingUnit] = useState(null);

    const [categorySearch, setCategorySearch] = useState('');
    const [brandSearch, setBrandSearch] = useState('');
    const [unitSearch, setUnitSearch] = useState('');

    const handleDelete = (endpoint, item) => {
        if (confirm('Are you sure you want to delete this item?')) {
            router.delete(`${endpoint}/${item.id}`, {
                preserveScroll: true,
            });
        }
    };

    const filteredCategories = categories
        .map((item) => ({ ...item, meta: item.parent?.name }))
        .filter(item => 
            item.name.toLowerCase().includes(categorySearch.toLowerCase()) || 
            (item.meta && item.meta.toLowerCase().includes(categorySearch.toLowerCase()))
        );

    const filteredBrands = brands.filter(item => 
        item.name.toLowerCase().includes(brandSearch.toLowerCase())
    );

    const filteredUnits = units
        .map((item) => ({ ...item, meta: item.symbol }))
        .filter(item => 
            item.name.toLowerCase().includes(unitSearch.toLowerCase()) || 
            (item.meta && item.meta.toLowerCase().includes(unitSearch.toLowerCase()))
        );

    return (
        <AuthenticatedLayout title="Inventory setup">
            <Head title="Inventory setup" />

            {flash.status && (
                <div className="mb-5 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">
                    {flash.status}
                </div>
            )}

            {errors.error && (
                <div className="mb-5 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger-ink">
                    {errors.error}
                </div>
            )}

            <section className="grid gap-6 xl:grid-cols-3">
                <SetupCard title="Categories" description="Organize products into nested groups." searchQuery={categorySearch} onSearchChange={setCategorySearch}>
                    <CategoryForm categories={categories} />
                    <ItemList 
                        items={filteredCategories} 
                        onEdit={(item) => setEditingCategory(item)}
                        onDelete={(item) => handleDelete('/inventory/categories', item)}
                    />
                </SetupCard>

                <SetupCard title="Brands" description="Manufacturers and commercial brands." searchQuery={brandSearch} onSearchChange={setBrandSearch}>
                    <SimpleForm endpoint="/inventory/brands" button="Add brand" />
                    <ItemList 
                        items={filteredBrands} 
                        onEdit={(item) => setEditingBrand(item)}
                        onDelete={(item) => handleDelete('/inventory/brands', item)}
                    />
                </SetupCard>

                <SetupCard title="Units" description="Pieces, liters, kilograms, boxes, and more." searchQuery={unitSearch} onSearchChange={setUnitSearch}>
                    <UnitForm />
                    <ItemList 
                        items={filteredUnits} 
                        onEdit={(item) => setEditingUnit(item)}
                        onDelete={(item) => handleDelete('/inventory/units', item)}
                    />
                </SetupCard>
            </section>

            {/* Edit Category Modal */}
            {editingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3 mb-4">
                            <h3 className="font-semibold text-lg text-foreground">Edit Category</h3>
                            <button type="button" onClick={() => setEditingCategory(null)} className="text-subtle hover:text-muted font-bold">✕</button>
                        </div>
                        <EditCategoryForm category={editingCategory} categories={categories} onClose={() => setEditingCategory(null)} />
                    </div>
                </div>
            )}

            {/* Edit Brand Modal */}
            {editingBrand && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3 mb-4">
                            <h3 className="font-semibold text-lg text-foreground">Edit Brand</h3>
                            <button type="button" onClick={() => setEditingBrand(null)} className="text-subtle hover:text-muted font-bold">✕</button>
                        </div>
                        <EditBrandForm brand={editingBrand} onClose={() => setEditingBrand(null)} />
                    </div>
                </div>
            )}

            {/* Edit Unit Modal */}
            {editingUnit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3 mb-4">
                            <h3 className="font-semibold text-lg text-foreground">Edit Unit</h3>
                            <button type="button" onClick={() => setEditingUnit(null)} className="text-subtle hover:text-muted font-bold">✕</button>
                        </div>
                        <EditUnitForm unit={editingUnit} onClose={() => setEditingUnit(null)} />
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function SetupCard({ title, description, searchQuery, onSearchChange, children }) {
    return (
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="font-semibold text-foreground text-base">{title}</h2>
            <p className="mt-1 text-xs text-muted mb-3">{description}</p>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder={`Search ${title.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-emerald-500"
                />
            </div>
            {children}
        </div>
    );
}

function CategoryForm({ categories }) {
    const form = useForm({ name: '', parent_id: '', description: '' });

    return (
        <form onSubmit={(e) => submit(e, form, '/inventory/categories')} className="space-y-4">
            <FloatingInput
                label="Category Name"
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                required
            />
            <SearchableSelect
                label="Parent Category"
                value={form.data.parent_id}
                onChange={(e) => form.setData('parent_id', e.target.value)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                empty="No parent"
            />
            <FormError errors={form.errors} />
            <SubmitButton form={form}>Add category</SubmitButton>
        </form>
    );
}

function UnitForm() {
    const form = useForm({ name: '', symbol: '', allows_decimal: false });

    return (
        <form onSubmit={(e) => submit(e, form, '/inventory/units')} className="space-y-4">
            <FloatingInput
                label="Unit Name"
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                required
            />
            <FloatingInput
                label="Symbol"
                value={form.data.symbol}
                onChange={(e) => form.setData('symbol', e.target.value)}
                required
            />
            <label className="flex items-center gap-2 text-sm text-muted select-none cursor-pointer">
                <input
                    type="checkbox"
                    checked={form.data.allows_decimal}
                    onChange={(e) => form.setData('allows_decimal', e.target.checked)}
                    className="rounded border-line text-success-ink focus:ring-emerald-500 h-4 w-4"
                />
                <span>Allow decimal quantities</span>
            </label>
            <FormError errors={form.errors} />
            <SubmitButton form={form}>Add unit</SubmitButton>
        </form>
    );
}

function SimpleForm({ endpoint, button }) {
    const form = useForm({ name: '' });

    return (
        <form onSubmit={(e) => submit(e, form, endpoint)} className="space-y-4">
            <FloatingInput
                label="Brand Name"
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                required
            />
            <FormError errors={form.errors} />
            <SubmitButton form={form}>{button}</SubmitButton>
        </form>
    );
}

function ItemList({ items, onEdit, onDelete }) {
    return (
        <div className="mt-4 max-h-60 space-y-2 overflow-auto pr-1">
            {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2 text-xs font-semibold text-foreground border border-line-soft hover:bg-surface-hover/50 transition-colors">
                    <div className="flex flex-col">
                        <span>{item.name}</span>
                        {item.meta && <span className="text-[10px] text-subtle font-mono mt-0.5">{item.meta}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => onEdit(item)}
                                className="p-1 text-subtle hover:text-success-ink rounded transition-colors hover:bg-surface-hover/50 cursor-pointer"
                                title="Edit"
                            >
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(item)}
                                className="p-1 text-subtle hover:text-danger-ink rounded transition-colors hover:bg-surface-hover/50 cursor-pointer"
                                title="Delete"
                            >
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {items.length === 0 && <p className="text-xs text-subtle italic text-center py-4">Nothing added yet.</p>}
        </div>
    );
}

function EditCategoryForm({ category, categories, onClose }) {
    const form = useForm({
        name: category.name,
        parent_id: category.parent_id ?? '',
        description: category.description ?? ''
    });

    const submit = (e) => {
        e.preventDefault();
        form.put(`/inventory/categories/${category.id}`, {
            preserveScroll: true,
            onSuccess: () => onClose()
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <FloatingInput
                label="Category Name"
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                required
            />
            <SearchableSelect
                label="Parent Category"
                value={form.data.parent_id}
                onChange={(e) => form.setData('parent_id', e.target.value)}
                options={categories.filter(c => c.id !== category.id).map((c) => ({ value: c.id, label: c.name }))}
                empty="No parent"
            />
            <FormError errors={form.errors} />
            <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={form.processing} className="rounded-xl bg-action px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer">Save Changes</button>
            </div>
        </form>
    );
}

function EditBrandForm({ brand, onClose }) {
    const form = useForm({
        name: brand.name
    });

    const submit = (e) => {
        e.preventDefault();
        form.put(`/inventory/brands/${brand.id}`, {
            preserveScroll: true,
            onSuccess: () => onClose()
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <FloatingInput
                label="Brand Name"
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                required
            />
            <FormError errors={form.errors} />
            <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={form.processing} className="rounded-xl bg-action px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer">Save Changes</button>
            </div>
        </form>
    );
}

function EditUnitForm({ unit, onClose }) {
    const form = useForm({
        name: unit.name,
        symbol: unit.symbol,
        allows_decimal: unit.allows_decimal ? true : false
    });

    const submit = (e) => {
        e.preventDefault();
        form.put(`/inventory/units/${unit.id}`, {
            preserveScroll: true,
            onSuccess: () => onClose()
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <FloatingInput
                label="Unit Name"
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                required
            />
            <FloatingInput
                label="Symbol"
                value={form.data.symbol}
                onChange={(e) => form.setData('symbol', e.target.value)}
                required
            />
            <label className="flex items-center gap-2 text-sm text-muted select-none cursor-pointer">
                <input
                    type="checkbox"
                    checked={form.data.allows_decimal}
                    onChange={(e) => form.setData('allows_decimal', e.target.checked)}
                    className="rounded border-line text-success-ink focus:ring-emerald-500 h-4 w-4"
                />
                <span>Allow decimal quantities</span>
            </label>
            <FormError errors={form.errors} />
            <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={form.processing} className="rounded-xl bg-action px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer">Save Changes</button>
            </div>
        </form>
    );
}

function FormError({ errors }) {
    const first = Object.values(errors)[0];
    return first ? <p className="text-xs text-danger-ink font-normal">{first}</p> : null;
}

function SubmitButton({ form, children }) {
    return (
        <button
            disabled={form.processing}
            className="w-full rounded-xl bg-action px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer"
        >
            {children}
        </button>
    );
}

function submit(event, form, endpoint) {
    event.preventDefault();
    form.post(endpoint, { preserveScroll: true, onSuccess: () => form.reset() });
}
