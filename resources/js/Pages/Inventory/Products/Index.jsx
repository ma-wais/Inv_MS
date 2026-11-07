import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useState } from 'react';
import FloatingInput from '../../../Components/FloatingInput';
import SearchableSelect from '../../../Components/SearchableSelect';
import Pagination from '../../../Components/Pagination';

export default function Index({ products, filters, categories = [], brands = [] }) {
    const [editingProduct, setEditingProduct] = useState(null);

    const editForm = useForm({
        name: '',
        category_id: '',
        brand_id: '',
        description: '',
        is_active: true,
        image: null,
        _method: 'PUT',
    });

    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [sortField, setSortField] = useState(filters.sort || 'id');
    const [sortDirection, setSortDirection] = useState(filters.direction || 'desc');

    const handleSort = (field) => {
        const nextDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(nextDirection);
        router.get('/products', {
            search: filters.search || '',
            category_id: categoryId,
            sort: field,
            direction: nextDirection
        }, { preserveState: true });
    };

    const handleCategoryChange = (e) => {
        const catId = e.target.value;
        setCategoryId(catId);
        router.get('/products', {
            search: filters.search || '',
            category_id: catId,
            sort: sortField,
            direction: sortDirection
        }, { preserveState: true });
    };

    function search(event) {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('search');
        router.get('/products', {
            search: value,
            category_id: categoryId,
            sort: sortField,
            direction: sortDirection
        }, { preserveState: true });
    }

    const handleDelete = (product) => {
        if (confirm(`Are you sure you want to delete the product "${product.name}"? This will delete all its variants, barcodes, and configurations.`)) {
            router.delete(`/products/${product.id}`);
        }
    };

    const handleEdit = (product) => {
        editForm.setData({
            name: product.name,
            category_id: product.category_id ?? '',
            brand_id: product.brand_id ?? '',
            description: product.description ?? '',
            is_active: product.is_active === undefined ? true : !!product.is_active,
            image: null,
            _method: 'PUT',
        });
        editForm.clearErrors();
        setEditingProduct(product);
    };

    const submitUpdate = (e) => {
        e.preventDefault();
        editForm.post(`/products/${editingProduct.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingProduct(null)
        });
    };

    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
    const brandOptions = brands.map(b => ({ value: b.id, label: b.name }));
    const activeOptions = [
        { value: 1, label: 'Active' },
        { value: 0, label: 'Inactive / Suspended' }
    ];

    return (
        <AuthenticatedLayout title="Products">
            <Head title="Products" />

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 flex-wrap items-center gap-3 max-w-2xl">
                    <form onSubmit={search} className="flex flex-1 gap-2 min-w-[250px]">
                        <input
                            name="search"
                            defaultValue={filters.search}
                            placeholder="Search name, SKU, or barcode"
                            className="w-full rounded-xl border border-line dark:border-slate-800 bg-surface dark:bg-slate-900 px-4 py-2.5 text-sm text-foreground dark:text-slate-100 outline-none focus:border-emerald-500 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                        <button className="rounded-xl border border-line dark:border-slate-700 bg-surface dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-foreground dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-slate-700 transition-colors cursor-pointer">Search</button>
                    </form>
                    <div className="min-w-[180px]">
                        <SearchableSelect
                            dense={true}
                            empty="All Categories"
                            options={categoryOptions}
                            value={categoryId}
                            onChange={(e) => {
                                const newCat = e.target.value;
                                setCategoryId(newCat);
                                router.get('/products', {
                                    search: filters.search,
                                    category_id: newCat,
                                    sort: sortField,
                                    direction: sortDirection
                                }, { preserveState: true });
                            }}
                        />
                    </div>
                </div>
                <Link href="/products/create" className="rounded-xl bg-action dark:bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors shadow-xs">
                    Add product
                </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-line dark:border-slate-800 bg-surface dark:bg-slate-900 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-line dark:border-slate-800 bg-surface-muted dark:bg-action text-xs uppercase tracking-wider text-muted dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-4 cursor-pointer hover:bg-surface-hover/50 dark:hover:bg-slate-900/50 select-none" onClick={() => handleSort('name')}>
                                    Product {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="px-5 py-4 cursor-pointer hover:bg-surface-hover/50 dark:hover:bg-slate-900/50 select-none" onClick={() => handleSort('category')}>
                                    Category / Brand {sortField === 'category' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="px-5 py-4 select-none">Variants</th>
                                <th className="px-5 py-4 cursor-pointer hover:bg-surface-hover/50 dark:hover:bg-slate-900/50 select-none" onClick={() => handleSort('stock')}>
                                    Current stock {sortField === 'stock' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="px-5 py-4 select-none">Unit</th>
                                <th className="text-right px-5 py-4 select-none">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line-soft dark:divide-slate-800/60">
                            {products.data.map((product) => (
                                <tr key={product.id} className="hover:bg-surface-muted/50 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="h-10 w-10 rounded-lg object-cover border border-line dark:border-slate-800"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-surface-hover dark:bg-slate-800 border border-line dark:border-slate-700 flex items-center justify-center text-subtle dark:text-slate-500 text-xs font-bold font-mono">
                                                    PKG
                                                </div>
                                            )}
                                            <div>
                                                <Link href={`/products/${product.id}`} className="font-semibold text-foreground dark:text-slate-100 hover:text-success-ink dark:hover:text-emerald-400 hover:underline">{product.name}</Link>
                                                <p className="text-[10px] capitalize text-subtle dark:text-slate-500 mt-0.5">{product.product_type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-muted dark:text-slate-300">
                                        {product.category?.name ?? 'Uncategorized'} / {product.brand?.name ?? 'No brand'}
                                    </td>
                                    <td className="px-5 py-4 text-muted dark:text-slate-300 font-medium">{product.variants_count}</td>
                                    <td className="px-5 py-4 text-foreground dark:text-slate-100">
                                        <div className="font-bold">{formatQuantity(product.stock_quantity)}</div>
                                        {product.variants && product.variants.length > 0 && (
                                            <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-muted dark:text-slate-400 font-medium">
                                                {product.variants.map((v) => (
                                                    <span key={v.id} className="whitespace-nowrap">
                                                        {v.name}: {formatQuantity(v.stock_quantity)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-muted dark:text-slate-400">{product.base_unit.symbol}</td>
                                    <td className="text-right px-5 py-3">
                                        <div className="flex justify-end gap-1.5">
                                            <Link
                                                href={`/products/${product.id}`}
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-line dark:border-slate-700 bg-surface dark:bg-slate-800 text-foreground dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-slate-700 transition-colors"
                                            >
                                                View Details
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(product)}
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-line dark:border-slate-700 bg-surface dark:bg-slate-800 text-foreground dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(product)}
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-danger-ink/30 dark:border-red-900/60 bg-danger-soft dark:bg-red-950/40 text-danger-ink dark:text-red-400 hover:bg-danger-soft dark:hover:bg-red-900/60 transition-colors cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.data.length === 0 && (
                                <tr><td colSpan="6" className="px-5 py-12 text-center text-subtle dark:text-slate-500">No products found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination links={products.links} />
            </div>

            {/* Edit details modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-action/60 backdrop-blur-sm transition-opacity">
                    <div className="relative w-full max-w-md rounded-2xl border border-line dark:border-slate-800 bg-surface dark:bg-slate-900 p-6 shadow-xl animate-scale-up">
                        <div className="flex items-center justify-between border-b border-line-soft dark:border-slate-800 pb-3 mb-4">
                            <h3 className="text-lg font-bold text-foreground dark:text-slate-100">Edit Product Details</h3>
                            <button
                                onClick={() => setEditingProduct(null)}
                                className="text-subtle hover:text-muted dark:hover:text-slate-200 transition-colors"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={submitUpdate} className="space-y-4">
                            <FloatingInput
                                id="edit_name"
                                name="name"
                                label="Product Name"
                                required
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                error={editForm.errors.name}
                            />

                            <SearchableSelect
                                id="edit_category_id"
                                name="category_id"
                                label="Category"
                                options={categoryOptions}
                                value={editForm.data.category_id}
                                onChange={(e) => editForm.setData('category_id', e.target.value)}
                                error={editForm.errors.category_id}
                                empty="Uncategorized"
                            />

                            <SearchableSelect
                                id="edit_brand_id"
                                name="brand_id"
                                label="Brand"
                                options={brandOptions}
                                value={editForm.data.brand_id}
                                onChange={(e) => editForm.setData('brand_id', e.target.value)}
                                error={editForm.errors.brand_id}
                                empty="No Brand"
                            />

                            <SearchableSelect
                                id="edit_is_active"
                                name="is_active"
                                label="Status"
                                options={activeOptions}
                                value={editForm.data.is_active ? 1 : 0}
                                onChange={(e) => editForm.setData('is_active', e.target.value === '1' || e.target.value === 1)}
                                error={editForm.errors.is_active}
                            />

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-subtle uppercase tracking-widest">Product Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => editForm.setData('image', e.target.files[0])}
                                    className="w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-line file:text-xs file:font-semibold file:bg-surface-muted file:text-foreground hover:file:bg-surface-hover cursor-pointer"
                                />
                                {editForm.errors.image && <p className="text-xs text-red-650 font-medium">{editForm.errors.image}</p>}
                            </div>

                            <div className="relative w-full">
                                <textarea
                                    id="edit_description"
                                    name="description"
                                    value={editForm.data.description ?? ''}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    placeholder=" "
                                    className="peer block w-full rounded-xl border border-line bg-surface px-4 pb-2.5 pt-5 text-sm text-foreground outline-none transition-all focus:border-emerald-500 min-h-[80px]"
                                />
                                <label
                                    htmlFor="edit_description"
                                    className="absolute left-4 top-2 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-xs text-subtle duration-150 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
                                >
                                    Description
                                </label>
                                {editForm.errors.description && <p className="mt-1 text-xs text-danger-ink font-normal">{editForm.errors.description}</p>}
                            </div>

                            <div className="flex justify-end gap-2 border-t border-line-soft pt-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingProduct(null)}
                                    className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded-xl bg-action px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 transition-colors disabled:opacity-60"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function formatQuantity(quantity) {
    return Number(quantity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

