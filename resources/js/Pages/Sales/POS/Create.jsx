import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import SearchableSelect from '../../../Components/SearchableSelect';
import PhoneInput from '../../../Components/PhoneInput';
import CnicInput from '../../../Components/CnicInput';
import { today } from '../../../Components/utils';

export default function Create({ customers, warehouses, accounts, variants: initialVariants, walk_in_customer_id, product_types = [] }) {
    const { auth } = usePage().props;
    const [variants, setVariants] = useState(initialVariants);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [notice, setNotice] = useState('');
    const searchRef = useRef(null);
    const ticketKey = `ventory_pos_${auth.tenant.id}_${auth.user.id}`;
    // Local state for search & view filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id ?? '');
    
    // Hold / Resume ticket system
    const [heldTickets, setHeldTickets] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(ticketKey) || '[]');
            return Array.isArray(saved) ? saved : [];
        } catch { return []; }
    });
    
    // Quick Add Customer modal state
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const customerForm = useForm({ name: '', phone: '', email: '', cnic: '' });
    const [creatingCustomer, setCreatingCustomer] = useState(false);
    const [addedCustomers, setAddedCustomers] = useState([]);

    // Inertia form submission
    const form = useForm({
        customer_id: walk_in_customer_id ?? '',
        warehouse_id: warehouses[0]?.id ?? '',
        sale_date: today(auth.tenant.timezone),
        status: 'posted', // POS is normally posted immediately
        discount_total: 0,
        tax_total: 0,
        shipping_total: 0,
        notes: '',
        items: [],
        
        // Immediate Payment options
        payment_amount: 0,
        payment_method: 'cash',
        payment_account_id: null,
        payment_reference: '',
        split_payment: false,
        second_payment_amount: 0,
        second_payment_method: 'bank',
    });

    // Sync warehouse_id from local state to form data
    useEffect(() => {
        form.setData('warehouse_id', selectedWarehouseId);
    }, [selectedWarehouseId]);

    // Save held tickets to local storage on change
    useEffect(() => {
        try { localStorage.setItem(ticketKey, JSON.stringify(heldTickets)); }
        catch { setNotice('Held tickets could not be saved on this device. Keep this page open.'); }
    }, [heldTickets]);

    // Derived unique categories
    const categories = useMemo(() => {
        const list = new Set(product_types);
        variants.forEach(v => {
            if (v.product?.product_type) list.add(v.product.product_type);
        });
        return ['all', ...Array.from(list)];
    }, [variants, product_types]);

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setCatalogLoading(true);
            try {
                const query = new URLSearchParams({ search: searchQuery, category: selectedCategory });
                const response = await fetch(`/pos/catalog?${query}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
                if (!response.ok) throw new Error('Search failed');
                const data = await response.json();
                setVariants(data.variants);
            } catch (error) {
                if (error.name !== 'AbortError') setNotice('Product search failed. Try again.');
            } finally { if (!controller.signal.aborted) setCatalogLoading(false); }
        }, 200);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [searchQuery, selectedCategory]);

    // Group variants by product
    const groupedProducts = useMemo(() => {
        const groups = {};
        variants.forEach(v => {
            if (!v.product) return;
            const prodId = v.product_id;
            if (!groups[prodId]) {
                groups[prodId] = {
                    product: v.product,
                    variants: [],
                };
            }
            groups[prodId].variants.push(v);
        });
        return Object.values(groups);
    }, [variants]);

    // Filter products based on search query and category
    const filteredProducts = useMemo(() => {
        return groupedProducts.filter(gp => {
            const matchesCategory = selectedCategory === 'all' || gp.product?.product_type === selectedCategory;
            if (!matchesCategory) return false;

            return true;
        });
    }, [groupedProducts, searchQuery, selectedCategory]);

    const [selectedVariantIds, setSelectedVariantIds] = useState({});
    const [selectedBatchIds, setSelectedBatchIds] = useState({});
    const batchOptions = variant => (variant.stock_balances || []).filter(balance =>
        Number(balance.warehouse_id) === Number(selectedWarehouseId) && Number(balance.quantity) > 0
        && balance.batch && (!balance.batch.expires_at || balance.batch.expires_at.slice(0, 10) >= today(auth.tenant.timezone))
    ).map(balance => ({ value: balance.product_batch_id, label: `${balance.batch.batch_number} · ${balance.quantity} available${balance.batch.expires_at ? ` · expires ${balance.batch.expires_at.slice(0, 10)}` : ''}` }));

    const getSelectedVariant = (prodId, productVariants) => {
        const id = selectedVariantIds[prodId];
        if (id) {
            return productVariants.find(v => v.id === id) || productVariants[0];
        }
        return productVariants[0];
    };

    // Helper to get stock of a variant in the selected warehouse, taking cart items into account
    const getStock = (variant, batchId) => {
        const balances = variant.stock_balances || variant.stockBalances || [];
        const matchingBalances = balances.filter(b => Number(b.warehouse_id) === Number(selectedWarehouseId) &&
            (batchId === undefined || Number(b.product_batch_id || 0) === Number(batchId || 0)) &&
            (!b.batch?.expires_at || b.batch.expires_at.slice(0, 10) >= today(auth.tenant.timezone)));
        const dbQty = matchingBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
        
        // Subtract quantities already in the cart for this variant
        const cartQty = form.data.items.filter(item => item.product_variant_id === variant.id &&
            (batchId === undefined || Number(item.product_batch_id || 0) === Number(batchId || 0)))
            .reduce((sum, item) => sum + Number(item.quantity), 0);
        
        return dbQty - cartQty;
    };

    // Cart Actions
    const addToCart = (variant) => {
        const batchId = selectedBatchIds[variant.id] || (variant.product.track_batches || getStock(variant, null) < 1 ? batchOptions(variant)[0]?.value : null);
        const existingIndex = form.data.items.findIndex(item => item.product_variant_id === variant.id && Number(item.product_batch_id || 0) === Number(batchId || 0));
        const stockLimit = getStock(variant, batchId);
        
        if (stockLimit < 1 || (variant.product.track_batches && !batchId)) {
            setNotice(`${variant.product.name} has insufficient available stock. Select another batch or warehouse.`);
            return;
        }

        if (existingIndex > -1) {
            const updatedItems = [...form.data.items];
            const newQty = Number(updatedItems[existingIndex].quantity) + 1;
            updatedItems[existingIndex] = { ...updatedItems[existingIndex], quantity: newQty };
            form.setData('items', updatedItems);
        } else {
            const newItem = {
                product_variant_id: variant.id,
                product_batch_id: batchId,
                variant_name: `${variant.product?.name || 'Unknown Product'} (${variant.name})`,
                sku: variant.sku,
                quantity: 1,
                unit_price: Number(variant.sale_price),
                stock: stockLimit,
                allows_decimal: Boolean(variant.product.base_unit?.allows_decimal),
            };
            form.setData('items', [...form.data.items, newItem]);
        }
    };

    const updateCartQty = (index, qty) => {
        const updatedItems = [...form.data.items];
        updatedItems[index] = { ...updatedItems[index], quantity: qty };
        form.setData('items', updatedItems);
    };

    const removeFromCart = (index) => {
        form.setData('items', form.data.items.filter((_, i) => i !== index));
    };

    // Calculations
    const subtotal = useMemo(() => {
        return form.data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    }, [form.data.items]);

    const grandTotal = useMemo(() => {
        return Math.max(0, subtotal - Number(form.data.discount_total) + Number(form.data.tax_total) + Number(form.data.shipping_total));
    }, [subtotal, form.data.discount_total, form.data.tax_total, form.data.shipping_total]);

    // Auto set payment amount to match grand total when cart changes
    useEffect(() => {
        form.setData('payment_amount', Math.max(0, grandTotal - (form.data.split_payment ? Number(form.data.second_payment_amount) : 0)));
    }, [grandTotal, form.data.split_payment, form.data.second_payment_amount]);

    // Handle POS submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.data.customer_id) {
            setNotice('Please select a customer.');
            return;
        }
        if (form.data.items.length === 0) {
            setNotice('Your cart is empty.');
            return;
        }
        if (form.data.items.some(item => !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0 || (!item.allows_decimal && !Number.isInteger(Number(item.quantity))))) {
            setNotice('Enter a valid quantity for every item. Piece and box quantities must be whole numbers.');
            return;
        }
        form.transform(data => ({ ...data, payments: data.split_payment ? [
            { amount: data.payment_amount, method: data.payment_method, account_id: data.payment_account_id || null },
            { amount: data.second_payment_amount, method: data.second_payment_method },
        ] : [] }));
        form.post('/sales');
    };

    // Hold Ticket
    const holdTicket = () => {
        if (form.data.items.length === 0) return;
        const newTicket = {
            id: Date.now(),
            customer_id: form.data.customer_id,
            warehouse_id: selectedWarehouseId,
            items: form.data.items,
            discount_total: form.data.discount_total,
            tax_total: form.data.tax_total,
            shipping_total: form.data.shipping_total,
            notes: form.data.notes,
            timestamp: new Date().toLocaleTimeString(),
        };
        setHeldTickets([...heldTickets, newTicket]);
        form.setData({
            ...form.data,
            items: [],
            discount_total: 0,
            tax_total: 0,
            shipping_total: 0,
            notes: '',
        });
    };

    // Resume Ticket
    const resumeTicket = (ticket) => {
        if (form.data.items.length && !confirm('Replace the current cart with this held ticket?')) return;
        if (ticket.warehouse_id) setSelectedWarehouseId(ticket.warehouse_id);
        form.setData({
            ...form.data,
            customer_id: ticket.customer_id,
            items: ticket.items,
            discount_total: ticket.discount_total,
            tax_total: ticket.tax_total,
            shipping_total: ticket.shipping_total,
            notes: ticket.notes,
        });
        setHeldTickets(heldTickets.filter(t => t.id !== ticket.id));
    };

    // Quick add customer via fetch/POST
    const addCustomer = async event => {
        event.preventDefault();
        if (creatingCustomer) return;
        setCreatingCustomer(true);
        customerForm.clearErrors();
        try {
            const cookie = document.cookie.split('; ').find(value => value.startsWith('XSRF-TOKEN='));
            const token = cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : '';
            const response = await fetch('/pos/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': token },
                body: JSON.stringify(customerForm.data),
            });
            const data = await response.json();
            if (!response.ok) {
                if (data.errors) customerForm.setError(Object.fromEntries(Object.entries(data.errors).map(([field, errors]) => [field, Array.isArray(errors) ? errors[0] : errors])));
                else customerForm.setError('request', 'Customer could not be saved. Try again.');
                return;
            }
            setAddedCustomers(previous => [...previous, data.customer]);
            form.setData('customer_id', data.customer.id);
            setShowCustomerModal(false);
            customerForm.reset();
        } catch { customerForm.setError('request', 'Customer could not be saved. Check your connection and try again.'); }
        finally { setCreatingCustomer(false); }
    };

    const scanBusy = useRef(false);
    async function scanBarcode(event) {
        if (event.key !== 'Enter' || !searchQuery.trim()) return;
        event.preventDefault();
        if (scanBusy.current) return;
        scanBusy.current = true;
        const code = searchQuery.trim();
        try {
            const response = await fetch(`/pos/catalog?${new URLSearchParams({ search: code })}`, { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error();
            const data = await response.json();
            const exact = data.variants.find(variant => variant.sku.toLowerCase() === code.toLowerCase() || variant.barcodes?.some(barcode => barcode.barcode === code));
            if (exact) { addToCart(exact); setSearchQuery(''); }
            else setNotice('No exact SKU or barcode found. Select an item from the search results.');
        } catch { setNotice('Barcode lookup failed. Try again.'); }
        finally { scanBusy.current = false; searchRef.current?.focus(); }
    }

    return (
        <AuthenticatedLayout title="Point of Sale">
            <Head title="POS Register" />
            {(notice || Object.keys(form.errors).length > 0) && <div role="alert" className="mb-3 rounded-xl border border-warning-ink/30 bg-warning-soft p-3 text-sm text-amber-900">
                {notice && <p>{notice} <button type="button" onClick={() => setNotice('')} className="ml-2 underline">Dismiss</button></p>}
                {Object.entries(form.errors).map(([field, error]) => <p key={field}>{error}</p>)}
            </div>}

            <div className="flex flex-col gap-6 lg:flex-row lg:h-[calc(100vh-8rem)] min-h-[600px]">
                {/* Left Side: Product Search & Grid */}
                <div className="flex-1 min-w-0 flex flex-col bg-surface rounded-2xl border border-line overflow-hidden p-4">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        {/* Search bar */}
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search by SKU, name or scan barcode..."
                                value={searchQuery}
                                ref={searchRef}
                                autoFocus
                                aria-label="Search products or scan a barcode"
                                maxLength={120}
                                onKeyDown={scanBarcode}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-line px-4 py-2 text-sm outline-none focus:border-emerald-500"
                            />
                        </div>

                        {/* Warehouse selector */}
                        <div>
                            <SearchableSelect dense label="Warehouse" value={selectedWarehouseId} options={warehouses.map(w => [w.id, w.name])} onChange={e => setSelectedWarehouseId(e.target.value)} required />
                        </div>
                    </div>

                    {/* Category tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-2 border-b border-line-soft">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                                    selectedCategory === cat
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-surface-muted text-muted hover:bg-surface-hover'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Products Table/List */}
                    <p role="status" className="mb-2 text-xs text-muted">{catalogLoading ? 'Searching products…' : `${variants.length} variants shown${variants.length === 60 ? ' · search to find more' : ''}`}</p>
                    <div className="flex-1 overflow-y-auto pr-1">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-surface-muted text-xs uppercase tracking-wider text-muted border-b border-line sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">SKU</th>
                                    <th className="px-4 py-3 font-semibold">Product Name</th>
                                    <th className="px-4 py-3 font-semibold">Category</th>
                                    <th className="px-4 py-3 font-semibold text-right">Price</th>
                                    <th className="px-4 py-3 font-semibold text-center">Stock</th>
                                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft bg-surface">
                                {filteredProducts.map(gp => {
                                    const variant = getSelectedVariant(gp.product.id, gp.variants);
                                    const stock = getStock(variant);
                                    return (
                                        <tr key={gp.product.id} className="hover:bg-surface-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-muted uppercase tracking-wider">{variant.sku}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-foreground">
                                                    {gp.product.name}
                                                </div>
                                                {gp.variants.length > 1 ? (
                                                    <SearchableSelect dense label="Product variant" value={variant.id} onChange={e => setSelectedVariantIds(prev => ({ ...prev, [gp.product.id]: Number(e.target.value) }))} options={gp.variants.map(v => [v.id, v.name])} />
                                                ) : (
                                                    <div className="text-xs text-subtle font-medium">
                                                        Variant: {variant.name}
                                                    </div>
                                                )}
                                                {(variant.product.track_batches || batchOptions(variant).length > 0) && <div className="mt-2"><SearchableSelect dense label="Batch" value={selectedBatchIds[variant.id] || batchOptions(variant)[0]?.value || ''} options={batchOptions(variant)} empty="No available batches" onChange={e => setSelectedBatchIds(prev => ({ ...prev, [variant.id]: e.target.value }))} /></div>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-md bg-surface-hover px-2 py-1 text-xs font-semibold text-muted uppercase">
                                                    {gp.product.product_type || 'Standard'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-955">
                                                PKR {Number(variant.sale_price).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${
                                                    stock <= 0 ? 'bg-danger-soft text-danger-ink' : 'bg-success-soft text-success-ink'
                                                }`}>
                                                    {stock}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(variant)}
                                                    disabled={stock < 1 || form.processing}
                                                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 text-xs transition-colors shadow-sm cursor-pointer"
                                                >
                                                    + Add
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-12 text-center text-subtle font-medium">
                                            No matching products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side: Cart Summary & Checkout */}
                <div className="w-full lg:w-[420px] flex flex-col bg-surface rounded-2xl border border-line overflow-hidden shadow-sm p-4">
                    {/* Header: Customer and Hold/Resume */}
                    <div className="border-b border-line-soft pb-3 mb-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-foreground">Checkout Cart</h3>
                            
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={holdTicket}
                                    className="px-2.5 py-1.5 text-xs font-semibold border border-line rounded-lg hover:bg-surface-muted"
                                >
                                    Hold ({heldTickets.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="px-2.5 py-1.5 text-xs font-semibold bg-surface-hover text-foreground rounded-lg hover:bg-surface-hover"
                                >
                                    + Customer
                                </button>
                            </div>
                        </div>

                        {/* Customer select */}
                        <div className="mt-3">
                            <SearchableSelect
                                label="Select Customer"
                                value={form.data.customer_id}
                                onChange={(e) => form.setData('customer_id', e.target.value)}
                                options={[...customers, ...addedCustomers.filter(added => !customers.some(customer => customer.id === added.id))].map(c => ({ value: c.id, label: `${c.name} ${c.phone ? `(${c.phone})` : ''}` }))}
                                required
                                empty="-- Select Customer --"
                                error={form.errors.customer_id}
                            />
                        </div>
                    </div>

                    {/* Held Tickets display (collapsible/visible if any) */}
                    {heldTickets.length > 0 && (
                        <div className="mb-3 p-2 bg-surface-muted rounded-xl max-h-24 overflow-y-auto">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Held Registers</p>
                            <div className="flex flex-wrap gap-2">
                                {heldTickets.map(ticket => (
                                    <button
                                        key={ticket.id}
                                        onClick={() => resumeTicket(ticket)}
                                        className="bg-surface border border-line px-2 py-1 rounded-lg text-xs hover:bg-success-soft hover:border-emerald-300 transition-all"
                                    >
                                        Ticket @ {ticket.timestamp}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cart Lines */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
                        {form.data.items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-subtle">
                                <span className="text-4xl">🛒</span>
                                <p className="mt-2 text-sm">Scan items or click catalog to add</p>
                            </div>
                        ) : (
                            form.data.items.map((item, index) => (
                                <div key={index} className="flex gap-2 p-2 rounded-xl bg-surface-muted border border-line-soft relative group">
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-foreground line-clamp-1">{item.variant_name}</p>
                                        <p className="text-[10px] text-subtle">{item.sku}</p>
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="number"
                                                step={item.allows_decimal ? 'any' : '1'}
                                                min={item.allows_decimal ? '0.000001' : '1'}
                                                aria-label={`Quantity for ${item.variant_name}`}
                                                value={item.quantity}
                                                onChange={(e) => updateCartQty(index, e.target.value)}
                                                className="w-16 rounded border border-line px-1.5 py-0.5 text-xs text-center"
                                            />
                                            <span className="text-xs text-muted">×</span>
                                            <span className="text-xs font-semibold">PKR {item.unit_price}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col justify-between">
                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(index)}
                                            className="text-red-500 hover:text-danger-ink text-xs self-end p-1"
                                        >
                                            Remove
                                        </button>
                                        <span className="text-xs font-bold text-foreground">PKR {(item.quantity * item.unit_price).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Summary Calculations */}
                    <div className="border-t border-line-soft pt-3 space-y-2 text-sm">
                        <div className="flex justify-between text-muted">
                            <span>Subtotal</span>
                            <span>PKR {subtotal.toLocaleString()}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-subtle">Discount</label>
                                <input
                                    type="number"
                                    value={form.data.discount_total}
                                    onChange={(e) => form.setData('discount_total', e.target.value)}
                                    className="w-full rounded border border-line px-2 py-1 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-subtle">Tax</label>
                                <input
                                    type="number"
                                    value={form.data.tax_total}
                                    onChange={(e) => form.setData('tax_total', e.target.value)}
                                    className="w-full rounded border border-line px-2 py-1 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-subtle">Shipping</label>
                                <input
                                    type="number"
                                    value={form.data.shipping_total}
                                    onChange={(e) => form.setData('shipping_total', e.target.value)}
                                    className="w-full rounded border border-line px-2 py-1 text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center font-bold text-foreground text-base pt-1 border-t border-line-soft">
                            <span>Grand Total</span>
                            <span className="text-success-ink">PKR {grandTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Checkout Details & Submit */}
                    <form onSubmit={handleSubmit} className="border-t border-line-soft pt-3 mt-3 space-y-2">
                        {/* Payment Selection */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-subtle">Pay Amount</label>
                                <input
                                    type="number"
                                    value={form.data.payment_amount}
                                    onChange={(e) => form.setData('payment_amount', e.target.value)}
                                    className="w-full rounded border border-line px-2 py-1 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-subtle">Pay Method</label>
                                <SearchableSelect dense label="Payment method" value={form.data.payment_method} onChange={e => form.setData('payment_method', e.target.value)} options={['cash', 'bank', 'card', 'mobile'].map(method => [method, method])} />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={form.data.split_payment} onChange={e => form.setData('split_payment', e.target.checked)} /> Split payment</label>
                        {form.data.split_payment && <div className="grid grid-cols-2 gap-2">
                            <input type="number" aria-label="Second payment amount" min="0" max={grandTotal} step="0.01" value={form.data.second_payment_amount} onChange={e => form.setData('second_payment_amount', e.target.value)} className="rounded-lg border border-line px-2 py-1 text-sm" />
                            <SearchableSelect dense label="Second payment method" value={form.data.second_payment_method} onChange={e => form.setData('second_payment_method', e.target.value)} options={['cash', 'bank', 'card', 'mobile'].map(method => [method, method])} />
                        </div>}
                        <p className="text-xs text-muted">Amount due: PKR {Math.max(0, grandTotal - Number(form.data.payment_amount) - (form.data.split_payment ? Number(form.data.second_payment_amount) : 0)).toLocaleString()}</p>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={form.processing || form.data.items.length === 0}
                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-center transition-colors disabled:opacity-60 shadow-lg shadow-emerald-600/10 mt-2"
                        >
                            {form.processing ? 'Processing Checkout...' : `Finalize & Print Invoice`}
                        </button>
                    </form>
                </div>
            </div>

            {/* Quick Add Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-action/40 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl p-6 border border-line animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-foreground text-lg">Add New Customer</h3>
                            <button onClick={() => setShowCustomerModal(false)} className="text-subtle hover:text-muted text-lg">×</button>
                        </div>
                        <form onSubmit={addCustomer} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Customer Name</label>
                                <input
                                    type="text"
                                    required
                                    value={customerForm.data.name}
                                    onChange={(e) => customerForm.setData('name', e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <PhoneInput
                                    name="phone"
                                    label="Phone number"
                                    value={customerForm.data.phone}
                                    onChange={(e) => customerForm.setData('phone', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Email address</label>
                                <input
                                    type="email"
                                    value={customerForm.data.email}
                                    onChange={(e) => customerForm.setData('email', e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                                />
                            </div>
                            <CnicInput value={customerForm.data.cnic} onChange={e => customerForm.setData('cnic', e.target.value)} error={customerForm.errors.cnic} />
                            {Object.entries(customerForm.errors).map(([field, error]) => <p key={field} role="alert" className="text-xs text-danger-ink">{error}</p>)}
                            <div className="flex gap-2 justify-end pt-2">
                                <button type="button" onClick={() => setShowCustomerModal(false)} className="px-4 py-2 text-sm border border-line rounded-lg">Cancel</button>
                                <button type="submit" disabled={creatingCustomer} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg">Add Customer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
