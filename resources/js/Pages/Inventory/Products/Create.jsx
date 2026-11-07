import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../../Components/FloatingInput';
import SearchableSelect from '../../../Components/SearchableSelect';
import React, { useState, useEffect } from 'react';

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
        image: null,
        variants: [
            {
                name: '',
                sku: '',
                barcode: '',
                purchase_price: '',
                sale_price: '',
                reorder_level: '0',
                opening_stock: '0',
                warehouse_id: warehouses[0]?.id ?? '',
            }
        ]
    });

    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddBrand, setShowAddBrand] = useState(false);
    const [showAddUnit, setShowAddUnit] = useState(false);

    const [lastAddedCategory, setLastAddedCategory] = useState('');
    const [lastAddedBrand, setLastAddedBrand] = useState('');
    const [lastAddedUnit, setLastAddedUnit] = useState('');

    useEffect(() => {
        if (lastAddedCategory) {
            const found = categories.find(c => c.name === lastAddedCategory);
            if (found) {
                form.setData('category_id', found.id);
                setLastAddedCategory('');
            }
        }
    }, [categories, lastAddedCategory]);

    useEffect(() => {
        if (lastAddedBrand) {
            const found = brands.find(b => b.name === lastAddedBrand);
            if (found) {
                form.setData('brand_id', found.id);
                setLastAddedBrand('');
            }
        }
    }, [brands, lastAddedBrand]);

    useEffect(() => {
        if (lastAddedUnit) {
            const found = units.find(u => u.name === lastAddedUnit);
            if (found) {
                form.setData('base_unit_id', found.id);
                setLastAddedUnit('');
            }
        }
    }, [units, lastAddedUnit]);

    function submit(event) {
        event.preventDefault();
        form.post('/products');
    }

    const addVariantRow = () => {
        form.setData('variants', [
            ...form.data.variants,
            {
                name: '',
                sku: '',
                barcode: '',
                purchase_price: '',
                sale_price: '',
                reorder_level: '0',
                opening_stock: '0',
                warehouse_id: warehouses[0]?.id ?? '',
            }
        ]);
    };

    const removeVariantRow = (index) => {
        if (form.data.variants.length > 1) {
            form.setData('variants', form.data.variants.filter((_, i) => i !== index));
        } else {
            alert('A product must have at least one variant.');
        }
    };

    const updateVariantRow = (index, field, value) => {
        const list = [...form.data.variants];
        list[index] = { ...list[index], [field]: value };
        form.setData('variants', list);
    };

    return (
        <AuthenticatedLayout title="Add product">
            <Head title="Add product" />

            <form onSubmit={submit} className="max-w-6xl space-y-4">
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-4">
                    <div className="border-b border-line-soft pb-3">
                        <h2 className="text-base font-semibold text-foreground">Add New Product Details & Variants</h2>
                        <p className="text-xs text-subtle">Specify general details and define one or more variants below.</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <FloatingInput
                            label="Product name"
                            error={form.errors.name}
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            required
                        />
                        <SearchableSelect
                            label="Product type"
                            error={form.errors.product_type}
                            value={form.data.product_type}
                            onChange={(e) => form.setData('product_type', e.target.value)}
                            options={[['standard', 'Standard'], ['paint', 'Paint'], ['medicine', 'Medicine']]}
                            required
                        />
                        
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <SearchableSelect
                                    label="Category"
                                    error={form.errors.category_id}
                                    value={form.data.category_id}
                                    onChange={(e) => form.setData('category_id', e.target.value)}
                                    options={categories.map((item) => ({ value: item.id, label: item.name }))}
                                    empty="Uncategorized"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddCategory(true)}
                                className="p-3 bg-surface-hover hover:bg-surface-hover text-foreground hover:text-foreground rounded-xl transition-colors min-h-[50px] flex items-center justify-center font-bold text-lg cursor-pointer"
                                title="Create new category inline"
                            >
                                +
                            </button>
                        </div>

                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <SearchableSelect
                                    label="Brand"
                                    error={form.errors.brand_id}
                                    value={form.data.brand_id}
                                    onChange={(e) => form.setData('brand_id', e.target.value)}
                                    options={brands.map((item) => ({ value: item.id, label: item.name }))}
                                    empty="No brand"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddBrand(true)}
                                className="p-3 bg-surface-hover hover:bg-surface-hover text-foreground hover:text-foreground rounded-xl transition-colors min-h-[50px] flex items-center justify-center font-bold text-lg cursor-pointer"
                                title="Create new brand inline"
                            >
                                +
                            </button>
                        </div>

                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <SearchableSelect
                                    label="Base unit"
                                    error={form.errors.base_unit_id}
                                    value={form.data.base_unit_id}
                                    onChange={(e) => form.setData('base_unit_id', e.target.value)}
                                    options={units.map((item) => ({ value: item.id, label: `${item.name} (${item.symbol})` }))}
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddUnit(true)}
                                className="p-3 bg-surface-hover hover:bg-surface-hover text-foreground hover:text-foreground rounded-xl transition-colors min-h-[50px] flex items-center justify-center font-bold text-lg cursor-pointer"
                                title="Create new unit inline"
                            >
                                +
                            </button>
                        </div>

                        <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="block text-[10px] font-bold text-subtle uppercase tracking-widest">Product Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => form.setData('image', e.target.files[0])}
                                className="w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-line file:text-xs file:font-semibold file:bg-surface-muted file:text-foreground hover:file:bg-surface-hover cursor-pointer"
                            />
                            {form.errors.image && <p className="text-xs text-danger-ink font-semibold">{form.errors.image}</p>}
                        </div>
                    </div>
                    
                    {/* Compact Description Textarea */}
                    <div className="relative w-full">
                        <textarea
                            id="description"
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            placeholder=" "
                            className="peer block w-full rounded-xl border border-line bg-surface px-4 pb-2 pt-5 text-sm text-foreground outline-none transition-all focus:border-emerald-500 min-h-16"
                        />
                        <label
                            htmlFor="description"
                            className="absolute left-4 top-2 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-xs text-subtle duration-150 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
                        >
                            Description
                        </label>
                    </div>

                    <div className="flex flex-wrap gap-5 text-sm">
                        <Checkbox
                            label="Track batches"
                            checked={form.data.track_batches}
                            onChange={(checked) => form.setData('track_batches', checked)}
                        />
                        <Checkbox
                            label="Track expiry dates"
                            checked={form.data.track_expiry}
                            onChange={(checked) => form.setData('track_expiry', checked)}
                        />
                    </div>

                    {/* Dynamic Variants Table */}
                    <div className="border-t border-line-soft pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-foreground">Product Variants</h3>
                            <button
                                type="button"
                                onClick={addVariantRow}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 text-xs transition-colors cursor-pointer"
                            >
                                + Add Variant
                            </button>
                        </div>

                        <div className="overflow-x-auto border border-line rounded-xl bg-surface-muted/30">
                            <table className="w-full text-left text-xs min-w-[900px]">
                                <thead className="bg-surface-muted border-b border-line uppercase tracking-wider text-muted font-bold">
                                    <tr>
                                        <th className="px-3 py-2.5">Variant Name *</th>
                                        <th className="px-3 py-2.5">SKU (Optional)</th>
                                        <th className="px-3 py-2.5">Barcode</th>
                                        <th className="px-3 py-2.5 w-24">Cost *</th>
                                        <th className="px-3 py-2.5 w-24">Price *</th>
                                        <th className="px-3 py-2.5 w-20">Reorder</th>
                                        <th className="px-3 py-2.5 w-20">Opening Qty</th>
                                        <th className="px-3 py-2.5">Opening Warehouse</th>
                                        <th className="px-3 py-2.5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {form.data.variants.map((v, index) => (
                                        <tr key={index} className="hover:bg-surface-muted/50">
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. 5 Gallon"
                                                    value={v.name}
                                                    onChange={(e) => updateVariantRow(index, 'name', e.target.value)}
                                                    className="w-full rounded-lg border border-line px-2 py-1 text-xs outline-none focus:border-emerald-500"
                                                />
                                                {form.errors[`variants.${index}.name`] && <p className="text-[10px] text-red-650 font-medium mt-0.5">{form.errors[`variants.${index}.name`]}</p>}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    placeholder="Auto-generated if blank"
                                                    value={v.sku}
                                                    onChange={(e) => updateVariantRow(index, 'sku', e.target.value)}
                                                    className="w-full rounded-lg border border-line px-2 py-1 text-xs outline-none focus:border-emerald-500 font-mono"
                                                />
                                                {form.errors[`variants.${index}.sku`] && <p className="text-[10px] text-red-655 font-medium mt-0.5">{form.errors[`variants.${index}.sku`]}</p>}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={v.barcode}
                                                    onChange={(e) => updateVariantRow(index, 'barcode', e.target.value)}
                                                    className="w-full rounded-lg border border-line px-2 py-1 text-xs outline-none focus:border-emerald-500 font-mono"
                                                />
                                                {form.errors[`variants.${index}.barcode`] && <p className="text-[10px] text-red-650 font-medium mt-0.5">{form.errors[`variants.${index}.barcode`]}</p>}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    step="any"
                                                    required
                                                    value={v.purchase_price}
                                                    onChange={(e) => updateVariantRow(index, 'purchase_price', e.target.value)}
                                                    className="w-full rounded-lg border border-line px-2 py-1 text-xs outline-none focus:border-emerald-500"
                                                />
                                                {form.errors[`variants.${index}.purchase_price`] && <p className="text-[10px] text-red-650 font-medium mt-0.5">{form.errors[`variants.${index}.purchase_price`]}</p>}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    step="any"
                                                    required
                                                    value={v.sale_price}
                                                    onChange={(e) => updateVariantRow(index, 'sale_price', e.target.value)}
                                                    className="w-full rounded-lg border border-line px-2 py-1 text-xs outline-none focus:border-emerald-500"
                                                />
                                                {form.errors[`variants.${index}.sale_price`] && <p className="text-[10px] text-red-650 font-medium mt-0.5">{form.errors[`variants.${index}.sale_price`]}</p>}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={v.reorder_level}
                                                    onChange={(e) => updateVariantRow(index, 'reorder_level', e.target.value)}
                                                    className="w-full rounded-lg border border-line px-2 py-1 text-xs outline-none focus:border-emerald-500"
                                                />
                                                {form.errors[`variants.${index}.reorder_level`] && <p className="text-[10px] text-red-650 font-medium mt-0.5">{form.errors[`variants.${index}.reorder_level`]}</p>}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={v.opening_stock}
                                                    onChange={(e) => updateVariantRow(index, 'opening_stock', e.target.value)}
                                                    className="w-full rounded-lg border border-line px-2 py-1 text-xs outline-none focus:border-emerald-500"
                                                />
                                                {form.errors[`variants.${index}.opening_stock`] && <p className="text-[10px] text-red-650 font-medium mt-0.5">{form.errors[`variants.${index}.opening_stock`]}</p>}
                                            </td>
                                            <td className="p-2">
                                                <SearchableSelect dense label="Opening stock warehouse" disabled={Number(v.opening_stock ?? 0) <= 0} value={v.warehouse_id} onChange={e => updateVariantRow(index, 'warehouse_id', e.target.value)} options={warehouses.map(wh => [wh.id, wh.name])} required={Number(v.opening_stock ?? 0) > 0} />
                                                {form.errors[`variants.${index}.warehouse_id`] && <p className="text-[10px] text-red-650 font-medium mt-0.5">{form.errors[`variants.${index}.warehouse_id`]}</p>}
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariantRow(index)}
                                                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-danger-soft text-danger-ink hover:bg-danger-soft hover:text-danger-ink transition-colors cursor-pointer"
                                                    title="Remove variant"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {form.errors.variants && (
                            <p className="text-xs text-danger-ink font-semibold mt-2">{form.errors.variants}</p>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-xl bg-action px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                        {form.processing ? 'Creating...' : 'Create product'}
                    </button>
                    <Link
                        href="/products"
                        className="rounded-xl border border-line bg-surface px-6 py-3 text-sm font-semibold hover:bg-surface-muted transition-colors"
                    >
                        Cancel
                    </Link>
                </div>
            </form>

            {/* Inline Category Modal */}
            {showAddCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3 mb-4">
                            <h3 className="font-semibold text-lg text-foreground">Add Category</h3>
                            <button type="button" onClick={() => setShowAddCategory(false)} className="text-subtle hover:text-muted font-bold">✕</button>
                        </div>
                        <InlineCategoryForm 
                            categories={categories} 
                            onSuccess={(name) => {
                                setLastAddedCategory(name);
                                setShowAddCategory(false);
                            }}
                            onClose={() => setShowAddCategory(false)}
                        />
                    </div>
                </div>
            )}

            {/* Inline Brand Modal */}
            {showAddBrand && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3 mb-4">
                            <h3 className="font-semibold text-lg text-foreground">Add Brand</h3>
                            <button type="button" onClick={() => setShowAddBrand(false)} className="text-subtle hover:text-muted font-bold">✕</button>
                        </div>
                        <InlineBrandForm 
                            onSuccess={(name) => {
                                setLastAddedBrand(name);
                                setShowAddBrand(false);
                            }}
                            onClose={() => setShowAddBrand(false)}
                        />
                    </div>
                </div>
            )}

            {/* Inline Unit Modal */}
            {showAddUnit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
                        <div className="flex justify-between items-center border-b border-line-soft pb-3 mb-4">
                            <h3 className="font-semibold text-lg text-foreground">Add Unit</h3>
                            <button type="button" onClick={() => setShowAddUnit(false)} className="text-subtle hover:text-muted font-bold">✕</button>
                        </div>
                        <InlineUnitForm 
                            onSuccess={(name) => {
                                setLastAddedUnit(name);
                                setShowAddUnit(false);
                            }}
                            onClose={() => setShowAddUnit(false)}
                        />
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function Checkbox({ label, checked, onChange }) {
    return (
        <label className="flex items-center gap-2 select-none cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="rounded border-line text-success-ink focus:ring-emerald-500 h-4 w-4"
            />
            <span className="text-sm font-medium text-foreground">{label}</span>
        </label>
    );
}

function InlineCategoryForm({ categories, onSuccess, onClose }) {
    const form = useForm({ name: '', parent_id: '', description: '' });

    const submit = (e) => {
        e.preventDefault();
        form.post('/inventory/categories', {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess(form.data.name);
            }
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
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                empty="No parent"
            />
            {form.errors.name && <p className="text-xs text-red-650 font-normal">{form.errors.name}</p>}
            <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={form.processing} className="rounded-xl bg-action px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer">Add Category</button>
            </div>
        </form>
    );
}

function InlineBrandForm({ onSuccess, onClose }) {
    const form = useForm({ name: '' });

    const submit = (e) => {
        e.preventDefault();
        form.post('/inventory/brands', {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess(form.data.name);
            }
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
            {form.errors.name && <p className="text-xs text-red-655 font-normal">{form.errors.name}</p>}
            <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={form.processing} className="rounded-xl bg-action px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer">Add Brand</button>
            </div>
        </form>
    );
}

function InlineUnitForm({ onSuccess, onClose }) {
    const form = useForm({ name: '', symbol: '', allows_decimal: false });

    const submit = (e) => {
        e.preventDefault();
        form.post('/inventory/units', {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess(form.data.name);
            }
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
            {form.errors.name && <p className="text-xs text-red-650 font-normal">{form.errors.name}</p>}
            {form.errors.symbol && <p className="text-xs text-red-650 font-normal">{form.errors.symbol}</p>}
            <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={form.processing} className="rounded-xl bg-action px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer">Add Unit</button>
            </div>
        </form>
    );
}
