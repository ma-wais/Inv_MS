import React, { useState, useEffect, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import SearchableSelect from '../../../Components/SearchableSelect';
import PhoneInput from '../../../Components/PhoneInput';

export default function Create({ customers, warehouses, accounts, variants, walk_in_customer_id }) {
    // Local state for search & view filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id ?? '');
    
    // Hold / Resume ticket system
    const [heldTickets, setHeldTickets] = useState(() => {
        const local = localStorage.getItem('ventory_held_pos_tickets');
        return local ? JSON.parse(local) : [];
    });
    
    // Quick Add Customer modal state
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '' });

    // Inertia form submission
    const form = useForm({
        customer_id: walk_in_customer_id ?? '',
        warehouse_id: warehouses[0]?.id ?? '',
        sale_date: new Date().toISOString().slice(0, 10),
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
    });

    // Sync warehouse_id from local state to form data
    useEffect(() => {
        form.setData('warehouse_id', selectedWarehouseId);
    }, [selectedWarehouseId]);

    // Save held tickets to local storage on change
    useEffect(() => {
        localStorage.setItem('ventory_held_pos_tickets', JSON.stringify(heldTickets));
    }, [heldTickets]);

    // Derived unique categories
    const categories = useMemo(() => {
        const list = new Set();
        variants.forEach(v => {
            if (v.product?.product_type) list.add(v.product.product_type);
        });
        return ['all', ...Array.from(list)];
    }, [variants]);

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

            const matchesSearch = searchQuery === '' || 
                (gp.product?.name && gp.product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                gp.variants.some(v => 
                    v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (v.barcodes && v.barcodes.some(b => b.barcode.includes(searchQuery)))
                );

            return matchesSearch;
        });
    }, [groupedProducts, searchQuery, selectedCategory]);

    const [selectedVariantIds, setSelectedVariantIds] = useState({});

    const getSelectedVariant = (prodId, productVariants) => {
        const id = selectedVariantIds[prodId];
        if (id) {
            return productVariants.find(v => v.id === id) || productVariants[0];
        }
        return productVariants[0];
    };

    // Helper to get stock of a variant in the selected warehouse, taking cart items into account
    const getStock = (variant) => {
        const balances = variant.stock_balances || variant.stockBalances || [];
        const matchingBalances = balances.filter(b => Number(b.warehouse_id) === Number(selectedWarehouseId));
        const dbQty = matchingBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
        
        // Subtract quantities already in the cart for this variant
        const cartItem = form.data.items.find(item => item.product_variant_id === variant.id);
        const cartQty = cartItem ? Number(cartItem.quantity) : 0;
        
        return dbQty - cartQty;
    };

    // Cart Actions
    const addToCart = (variant) => {
        const existingIndex = form.data.items.findIndex(item => item.product_variant_id === variant.id);
        const stockLimit = getStock(variant);
        
        if (stockLimit <= 0) {
            alert(`Warning: ${variant.name} is out of stock in this warehouse.`);
        }

        if (existingIndex > -1) {
            const updatedItems = [...form.data.items];
            const newQty = updatedItems[existingIndex].quantity + 1;
            updatedItems[existingIndex].quantity = newQty;
            form.setData('items', updatedItems);
        } else {
            const newItem = {
                product_variant_id: variant.id,
                variant_name: `${variant.product?.name || 'Unknown Product'} (${variant.name})`,
                sku: variant.sku,
                quantity: 1,
                unit_price: Number(variant.sale_price),
                stock: stockLimit
            };
            form.setData('items', [...form.data.items, newItem]);
        }
    };

    const updateCartQty = (index, qty) => {
        const updatedItems = [...form.data.items];
        updatedItems[index].quantity = Math.max(0.1, Number(qty));
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
        form.setData('payment_amount', grandTotal);
    }, [grandTotal]);

    // Handle POS submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.data.customer_id) {
            alert('Please select a customer.');
            return;
        }
        if (form.data.items.length === 0) {
            alert('Your cart is empty.');
            return;
        }
        form.post('/sales');
    };

    // Hold Ticket
    const holdTicket = () => {
        if (form.data.items.length === 0) return;
        const newTicket = {
            id: Date.now(),
            customer_id: form.data.customer_id,
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
    const addCustomer = (e) => {
        e.preventDefault();
        router.post('/customers', newCustomerData, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCustomerModal(false);
                setNewCustomerData({ name: '', phone: '', email: '' });
                // We'll let Inertia reload the page, which updates the customers prop.
            }
        });
    };

    return (
        <AuthenticatedLayout title="Point of Sale">
            <Head title="POS Register" />

            <div className="flex flex-col gap-6 lg:flex-row h-[calc(100vh-8rem)]">
                {/* Left Side: Product Search & Grid */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden p-4">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        {/* Search bar */}
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search by SKU, name or scan barcode..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500"
                            />
                        </div>

                        {/* Warehouse selector */}
                        <div>
                            <select
                                value={selectedWarehouseId}
                                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            >
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Category tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-2 border-b border-slate-100">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                                    selectedCategory === cat
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Products Table/List */}
                    <div className="flex-1 overflow-y-auto pr-1">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">SKU</th>
                                    <th className="px-4 py-3 font-semibold">Product Name</th>
                                    <th className="px-4 py-3 font-semibold">Category</th>
                                    <th className="px-4 py-3 font-semibold text-right">Price</th>
                                    <th className="px-4 py-3 font-semibold text-center">Stock</th>
                                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredProducts.map(gp => {
                                    const variant = getSelectedVariant(gp.product.id, gp.variants);
                                    const stock = getStock(variant);
                                    return (
                                        <tr key={gp.product.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500 uppercase tracking-wider">{variant.sku}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-800">
                                                    {gp.product.name}
                                                </div>
                                                {gp.variants.length > 1 ? (
                                                    <select
                                                        value={variant.id}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            setSelectedVariantIds(prev => ({ ...prev, [gp.product.id]: val }));
                                                        }}
                                                        className="mt-1 text-xs rounded-lg border border-slate-200 bg-white px-2 py-1 outline-none focus:border-emerald-500 cursor-pointer font-medium text-slate-700"
                                                    >
                                                        {gp.variants.map(v => (
                                                            <option key={v.id} value={v.id}>{v.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="text-xs text-slate-400 font-medium">
                                                        Variant: {variant.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 uppercase">
                                                    {gp.product.product_type || 'Standard'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-955">
                                                PKR {Number(variant.sale_price).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${
                                                    stock <= 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {stock}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(variant)}
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
                                        <td colSpan="6" className="px-4 py-12 text-center text-slate-400 font-medium">
                                            No matching products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side: Cart Summary & Checkout */}
                <div className="w-full lg:w-[420px] flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-4">
                    {/* Header: Customer and Hold/Resume */}
                    <div className="border-b border-slate-100 pb-3 mb-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-slate-800">Checkout Cart</h3>
                            
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={holdTicket}
                                    className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50"
                                >
                                    Hold ({heldTickets.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200"
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
                                options={customers.map(c => ({ value: c.id, label: `${c.name} ${c.phone ? `(${c.phone})` : ''}` }))}
                                required
                                empty="-- Select Customer --"
                            />
                        </div>
                    </div>

                    {/* Held Tickets display (collapsible/visible if any) */}
                    {heldTickets.length > 0 && (
                        <div className="mb-3 p-2 bg-slate-50 rounded-xl max-h-24 overflow-y-auto">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Held Registers</p>
                            <div className="flex flex-wrap gap-2">
                                {heldTickets.map(ticket => (
                                    <button
                                        key={ticket.id}
                                        onClick={() => resumeTicket(ticket)}
                                        className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs hover:bg-emerald-50 hover:border-emerald-300 transition-all"
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
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <span className="text-4xl">🛒</span>
                                <p className="mt-2 text-sm">Scan items or click catalog to add</p>
                            </div>
                        ) : (
                            form.data.items.map((item, index) => (
                                <div key={index} className="flex gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 relative group">
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.variant_name}</p>
                                        <p className="text-[10px] text-slate-400">{item.sku}</p>
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="number"
                                                step="any"
                                                value={item.quantity}
                                                onChange={(e) => updateCartQty(index, e.target.value)}
                                                className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-center"
                                            />
                                            <span className="text-xs text-slate-500">×</span>
                                            <span className="text-xs font-semibold">PKR {item.unit_price}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col justify-between">
                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(index)}
                                            className="text-red-500 hover:text-red-700 text-xs self-end p-1"
                                        >
                                            Remove
                                        </button>
                                        <span className="text-xs font-bold text-slate-800">PKR {(item.quantity * item.unit_price).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Summary Calculations */}
                    <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>PKR {subtotal.toLocaleString()}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-slate-400">Discount</label>
                                <input
                                    type="number"
                                    value={form.data.discount_total}
                                    onChange={(e) => form.setData('discount_total', e.target.value)}
                                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-slate-400">Tax</label>
                                <input
                                    type="number"
                                    value={form.data.tax_total}
                                    onChange={(e) => form.setData('tax_total', e.target.value)}
                                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-slate-400">Shipping</label>
                                <input
                                    type="number"
                                    value={form.data.shipping_total}
                                    onChange={(e) => form.setData('shipping_total', e.target.value)}
                                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center font-bold text-slate-800 text-base pt-1 border-t border-slate-100">
                            <span>Grand Total</span>
                            <span className="text-emerald-700">PKR {grandTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Checkout Details & Submit */}
                    <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-3 mt-3 space-y-2">
                        {/* Payment Selection */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-slate-400">Pay Amount</label>
                                <input
                                    type="number"
                                    value={form.data.payment_amount}
                                    onChange={(e) => form.setData('payment_amount', e.target.value)}
                                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-slate-400">Pay Method</label>
                                <select
                                    value={form.data.payment_method}
                                    onChange={(e) => form.setData('payment_method', e.target.value)}
                                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs bg-white"
                                >
                                    {['cash', 'bank', 'card', 'mobile'].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 text-lg">Add New Customer</h3>
                            <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
                        </div>
                        <form onSubmit={addCustomer} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newCustomerData.name}
                                    onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <PhoneInput
                                    name="phone"
                                    label="Phone number"
                                    value={newCustomerData.phone}
                                    onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email address</label>
                                <input
                                    type="email"
                                    value={newCustomerData.email}
                                    onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button type="button" onClick={() => setShowCustomerModal(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg">Add Customer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
