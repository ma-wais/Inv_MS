import { Head, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useState, useMemo } from 'react';
import FloatingInput from '../../../Components/FloatingInput';
import SearchableSelect from '../../../Components/SearchableSelect';
import Pagination from '../../../Components/Pagination';

export default function Index({ balances, movements, variants, warehouses, lowStock, filters }) {
    const { flash } = usePage().props;
    
    // Filters state
    const [searchVal, setSearchVal] = useState(filters?.search ?? '');
    const [warehouseVal, setWarehouseVal] = useState(filters?.warehouse_id ?? '');
    const [variantVal, setProductVariantVal] = useState(filters?.product_variant_id ?? '');

    // Extract unique products
    const uniqueProducts = useMemo(() => {
        const productMap = new Map();
        variants.forEach(v => {
            if (v.product) {
                productMap.set(v.product.id, v.product);
            }
        });
        return Array.from(productMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [variants]);

    // Find matched product if searching
    const initialSelectedProduct = useMemo(() => {
        if (!filters?.search) return '';
        const matched = uniqueProducts.find(p => p.name === filters.search);
        return matched ? matched.id : '';
    }, [filters?.search, uniqueProducts]);

    const [selectedFilterProductId, setSelectedFilterProductId] = useState(initialSelectedProduct);
    const [selectedModalProductId, setSelectedModalProductId] = useState('');

    // Modal state
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

    // Adjustment Form
    const adjustForm = useForm({
        warehouse_id: warehouses[0]?.id ?? '',
        product_variant_id: '',
        quantity: '',
        note: ''
    });

    function submitAdjustment(event) {
        event.preventDefault();
        adjustForm.post('/stock/adjustments', {
            preserveScroll: true,
            onSuccess: () => {
                adjustForm.reset('quantity', 'note');
                setIsAdjustModalOpen(false);
                setSelectedModalProductId('');
            }
        });
    }

    function runFilters(search = searchVal, whId = warehouseVal, varId = variantVal) {
        const query = {};
        if (search) query.search = search;
        if (whId) query.warehouse_id = whId;
        if (varId) query.product_variant_id = varId;

        router.get('/stock', query, { preserveState: true, preserveScroll: true });
    }

    function clearFilters() {
        setSearchVal('');
        setWarehouseVal('');
        setProductVariantVal('');
        setSelectedFilterProductId('');
        router.get('/stock', {}, { preserveState: true, preserveScroll: true });
    }

    const warehouseOptions = warehouses.map(w => ({
        value: w.id,
        label: w.name
    }));

    const variantOptions = variants.map(v => ({
        value: v.id,
        label: `${v.product.name} (${v.name}) · ${v.sku}`
    }));

    const hasFiltersActive = searchVal || warehouseVal || variantVal;

    return (
        <AuthenticatedLayout title="Stock Ledger">
            <Head title="Stock Ledger" />

            {flash.status && <div className="mb-5 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">{flash.status}</div>}

            {lowStock.length > 0 && (
                <section className="mb-6 rounded-2xl border border-warning-ink/30 bg-warning-soft/50 p-5">
                    <h2 className="font-semibold text-amber-900 text-sm">Low-stock alerts</h2>
                    <div className="mt-3 grid gap-2.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {lowStock.map((variant) => (
                            <div key={variant.id} className="rounded-xl border border-warning-ink/20 bg-surface/80 p-3 shadow-xs">
                                <p className="font-semibold text-xs text-foreground truncate">{variant.product.name}</p>
                                <p className="text-[11px] font-medium text-warning-ink mt-1">
                                    {variant.sku}: {qty(variant.stock_quantity ?? 0)} / min {qty(variant.reorder_level)} {variant.product.base_unit?.symbol}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Disciplined Filter & Action Toolbar */}
            <div className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                    {/* Product Selector */}
                    <div className="w-full sm:w-64">
                        <SearchableSelect
                            id="filter_product_id"
                            name="filter_product_id"
                            label="Product"
                            options={uniqueProducts.map(p => ({ value: p.id, label: p.name }))}
                            value={selectedFilterProductId}
                            onChange={(e) => {
                                const prodId = e.target.value;
                                setSelectedFilterProductId(prodId);
                                const matchedProduct = uniqueProducts.find(p => String(p.id) === String(prodId));
                                const newSearch = matchedProduct ? matchedProduct.name : '';
                                setSearchVal(newSearch);
                                setProductVariantVal('');
                                runFilters(newSearch, warehouseVal, '');
                            }}
                            empty="All Products"
                        />
                    </div>
                    {/* Warehouse Selector */}
                    <div className="w-full sm:w-56">
                        <SearchableSelect
                            id="warehouseVal"
                            name="warehouseVal"
                            label="Warehouse"
                            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                            value={warehouseVal}
                            onChange={(e) => {
                                setWarehouseVal(e.target.value);
                                runFilters(searchVal, e.target.value, variantVal);
                            }}
                            empty="All Warehouses"
                        />
                    </div>
                    {/* Product Variant Selector - Only visible when product is selected */}
                    {selectedFilterProductId && (
                        <div className="w-full sm:w-72">
                            <SearchableSelect
                                id="variantVal"
                                name="variantVal"
                                label="Product Variant"
                                options={variants
                                    .filter(v => String(v.product_id) === String(selectedFilterProductId))
                                    .map(v => ({ value: v.id, label: `${v.name} · ${v.sku}` }))}
                                value={variantVal}
                                onChange={(e) => {
                                    setProductVariantVal(e.target.value);
                                    runFilters(searchVal, warehouseVal, e.target.value);
                                }}
                                empty="All Product Variants"
                            />
                        </div>
                    )}
                    
                    {/* Filter Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => runFilters(searchVal, warehouseVal, variantVal)}
                            className="rounded-xl bg-action px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            Apply Filters
                        </button>
                        {hasFiltersActive && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors cursor-pointer"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsAdjustModalOpen(true)}
                    className="rounded-xl bg-emerald-600 dark:bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
                >
                    <span>+ Adjust Stock</span>
                </button>
            </div>

            {/* Unified Ledger Panels (Balances & Movements side-by-side) */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Balances Card */}
                <div className="lg:col-span-7 rounded-2xl border border-line dark:border-slate-800 bg-surface dark:bg-slate-900 shadow-sm flex flex-col h-fit overflow-hidden">
                    <div className="border-b border-line-soft dark:border-slate-800 p-4 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-foreground dark:text-slate-100 text-sm">Current balances</h2>
                            <p className="text-[11px] text-muted dark:text-slate-400">Low-stock rows are highlighted in amber.</p>
                        </div>
                        <span className="rounded-full bg-surface-hover dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-muted dark:text-slate-300">{(balances.total ?? balances.data.length)} items</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted dark:bg-action text-[11px] uppercase tracking-wider text-muted dark:text-slate-400 border-b border-line-soft dark:border-slate-800">
                                <tr>
                                    <th className="px-5 py-3">Product</th>
                                    <th>Warehouse</th>
                                    <th>Batch</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft dark:divide-slate-800/60">
                                {balances.data.map((balance) => {
                                    const low = Number(balance.quantity) <= Number(balance.variant.reorder_level);
                                    return (
                                        <tr key={balance.id} className={`hover:bg-surface-muted/50 dark:hover:bg-slate-800/40 ${low ? 'bg-warning-soft/50 dark:bg-amber-950/20' : ''}`}>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="font-semibold text-foreground dark:text-slate-100 text-xs">{balance.variant.product.name}</p>
                                                    <span className="rounded bg-surface-hover dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-muted dark:text-slate-300">{balance.variant.name}</span>
                                                </div>
                                                <p className="text-[10px] text-subtle dark:text-slate-500 font-mono mt-0.5">{balance.variant.sku}</p>
                                            </td>
                                            <td className="text-muted dark:text-slate-300 text-xs font-medium">{balance.warehouse.name}</td>
                                            <td className="text-muted dark:text-slate-400 text-xs">{balance.batch?.batch_number ?? 'No batch'}</td>
                                            <td className="font-bold text-foreground dark:text-slate-100 text-xs">
                                                {qty(balance.quantity)} {balance.variant.product.base_unit?.symbol}
                                                {low && <span className="ml-2 rounded-md bg-warning-soft dark:bg-amber-950/70 px-1.5 py-0.5 text-[9px] font-black text-warning-ink dark:text-amber-300 uppercase tracking-wider">Low</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {balances.data.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-5 py-8 text-center text-xs text-subtle dark:text-slate-500">
                                            No stock balances match the search criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={balances.links} />
                </div>

                {/* Movements Ledger Card */}
                <div className="lg:col-span-5 rounded-2xl border border-line dark:border-slate-800 bg-surface dark:bg-slate-900 shadow-sm flex flex-col h-fit overflow-hidden">
                    <div className="border-b border-line-soft dark:border-slate-800 p-4">
                        <h2 className="font-bold text-foreground dark:text-slate-100 text-sm">Recent movements ledger</h2>
                        <p className="text-[11px] text-muted dark:text-slate-400">Trace stock increases and decreases by timeline.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-muted dark:bg-action text-[11px] uppercase tracking-wider text-muted dark:text-slate-400 border-b border-line-soft dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Product / Date</th>
                                    <th>Type</th>
                                    <th className="text-right px-4">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft dark:divide-slate-800/60">
                                {movements.data.map((movement) => (
                                    <tr key={movement.id} className="hover:bg-surface-muted/50 dark:hover:bg-slate-800/40 text-xs">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <p className="font-semibold text-foreground dark:text-slate-100 text-xs">{movement.variant.product.name}</p>
                                                <span className="rounded bg-surface-hover dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-muted dark:text-slate-300">{movement.variant.name}</span>
                                            </div>
                                            <p className="text-[9px] text-subtle dark:text-slate-500 mt-0.5">{new Date(movement.occurred_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</p>
                                            {movement.note && <p className="text-[10px] text-muted dark:text-slate-400 italic mt-1 font-normal max-w-xs">{movement.note}</p>}
                                        </td>
                                        <td className="capitalize font-medium text-muted dark:text-slate-300 text-[10px]">
                                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                                movement.type.includes('sale') ? 'bg-danger-soft dark:bg-red-950/40 text-danger-ink dark:text-red-400 border border-danger-ink/20 dark:border-red-900/60' :
                                                movement.type.includes('purchase') ? 'bg-success-soft dark:bg-emerald-950/40 text-success-ink dark:text-emerald-400 border border-success-ink/20 dark:border-emerald-900/60' :
                                                'bg-surface-hover dark:bg-slate-800 text-foreground dark:text-slate-300 border border-line dark:border-slate-700'
                                            }`}>
                                                {movement.type.replaceAll('_', ' ')}
                                            </span>
                                        </td>
                                        <td className={`font-bold text-right px-4 text-xs ${Number(movement.quantity) < 0 ? 'text-danger-ink dark:text-rose-400' : 'text-success-ink dark:text-emerald-400'}`}>
                                            {Number(movement.quantity) > 0 ? '+' : ''}{qty(movement.quantity)}
                                        </td>
                                    </tr>
                                ))}
                                {movements.data.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-xs text-subtle dark:text-slate-500">
                                            No recent movements match the search criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={movements.links} />
                </div>
            </div>

            {/* Manual Stock Adjustment Modal */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-action/60 backdrop-blur-xs p-4 animate-fade-in">
                    <div className="w-full max-w-md rounded-2xl bg-surface dark:bg-slate-900 p-5 shadow-2xl border border-line-soft dark:border-slate-800 animate-slide-up">
                        <div className="flex justify-between items-center border-b border-line-soft dark:border-slate-800 pb-3 mb-4">
                            <div>
                                <h3 className="font-bold text-base text-foreground dark:text-slate-100">Record stock adjustment</h3>
                                <p className="text-[10px] text-subtle dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Manual Inventory Update</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    adjustForm.clearErrors();
                                    setIsAdjustModalOpen(false);
                                    setSelectedModalProductId('');
                                }}
                                className="text-subtle hover:text-muted font-bold text-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={submitAdjustment} className="space-y-4">
                            <SearchableSelect
                                id="warehouse_id"
                                name="warehouse_id"
                                label="Warehouse"
                                required
                                options={warehouseOptions}
                                value={adjustForm.data.warehouse_id}
                                onChange={(e) => adjustForm.setData('warehouse_id', e.target.value)}
                                error={adjustForm.errors.warehouse_id}
                            />

                            <SearchableSelect
                                id="modal_product_id"
                                name="modal_product_id"
                                label="Product"
                                required
                                options={uniqueProducts.map(p => ({ value: p.id, label: p.name }))}
                                value={selectedModalProductId}
                                onChange={(e) => {
                                    const prodId = e.target.value;
                                    setSelectedModalProductId(prodId);
                                    adjustForm.setData('product_variant_id', '');
                                }}
                                empty="Select product..."
                            />

                            {selectedModalProductId && (
                                <SearchableSelect
                                    id="product_variant_id"
                                    name="product_variant_id"
                                    label="Product Variant"
                                    required
                                    options={variants
                                        .filter(v => String(v.product_id) === String(selectedModalProductId))
                                        .map(v => ({ value: v.id, label: `${v.name} · ${v.sku}` }))}
                                    value={adjustForm.data.product_variant_id}
                                    onChange={(e) => adjustForm.setData('product_variant_id', e.target.value)}
                                    error={adjustForm.errors.product_variant_id}
                                    empty="Select product variant..."
                                />
                            )}

                            <FloatingInput
                                id="quantity"
                                name="quantity"
                                type="number"
                                step="any"
                                label="Quantity Change (e.g. -5 or 10)"
                                required
                                placeholder="Use negative values to deduct stock"
                                value={adjustForm.data.quantity}
                                onChange={(e) => adjustForm.setData('quantity', e.target.value)}
                                error={adjustForm.errors.quantity}
                            />

                            <div className="relative w-full">
                                <textarea
                                    id="note"
                                    name="note"
                                    value={adjustForm.data.note}
                                    onChange={(e) => adjustForm.setData('note', e.target.value)}
                                    placeholder=" "
                                    className="peer block w-full rounded-xl border border-line bg-surface px-4 pb-2.5 pt-5 text-xs text-foreground outline-none transition-all focus:border-emerald-500 min-h-[75px]"
                                    required
                                />
                                <label
                                    htmlFor="note"
                                    className="absolute left-4 top-2 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-[10px] text-subtle duration-150 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
                                >
                                    Reason for adjustment
                                </label>
                                {adjustForm.errors.note && <p className="mt-1 text-[10px] text-danger-ink font-normal">{adjustForm.errors.note}</p>}
                            </div>

                            {Object.values(adjustForm.errors)[0] && !adjustForm.errors.quantity && !adjustForm.errors.warehouse_id && !adjustForm.errors.product_variant_id && !adjustForm.errors.note && (
                                <p className="text-xs text-danger-ink font-medium">{Object.values(adjustForm.errors)[0]}</p>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        adjustForm.clearErrors();
                                        setIsAdjustModalOpen(false);
                                        setSelectedModalProductId('');
                                    }}
                                    className="rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-muted hover:bg-surface-muted transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={adjustForm.processing}
                                    className="rounded-xl bg-action px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-900 transition-colors disabled:opacity-60 cursor-pointer"
                                >
                                    Record Adjustment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function qty(value) {
    return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 });
}
