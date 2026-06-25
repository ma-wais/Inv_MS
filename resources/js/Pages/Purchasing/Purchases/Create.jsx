import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../../Components/FloatingInput';
import SearchableSelect from '../../../Components/SearchableSelect';

export default function Create({ suppliers, warehouses, variants, nextSupplierInvoiceNumber, nextBatchNumber }) {
    const form = useForm({
        supplier_id: suppliers[0]?.id ?? '',
        warehouse_id: warehouses[0]?.id ?? '',
        supplier_invoice_number: nextSupplierInvoiceNumber ?? '',
        purchase_date: new Date().toISOString().slice(0, 10),
        due_date: '',
        status: 'draft',
        discount_total: '0',
        tax_total: '0',
        shipping_total: '0',
        notes: '',
        items: [
            { product_variant_id: variants[0]?.id ?? '', quantity: '', unit_cost: variants[0]?.purchase_price ?? '', batch_number: nextBatchNumber ?? '', expires_at: '' },
        ],
    });

    function incrementStringNumber(string) {
        if (!string) return '1';
        const regex = /^(.*?)(\d+)$/;
        const matches = string.match(regex);
        if (matches) {
            const prefix = matches[1];
            const numberStr = matches[2];
            const len = numberStr.length;
            const nextNumber = parseInt(numberStr, 10) + 1;
            const nextNumberStr = String(nextNumber).padStart(len, '0');
            return prefix + nextNumberStr;
        }
        
        const digitRegex = /(\d+)/;
        const digitMatches = string.match(digitRegex);
        if (digitMatches) {
            const numberStr = digitMatches[1];
            const len = numberStr.length;
            const nextNumber = parseInt(numberStr, 10) + 1;
            const nextNumberStr = String(nextNumber).padStart(len, '0');
            return string.replace(numberStr, nextNumberStr);
        }
        
        return string + '1';
    }

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

            <form onSubmit={submit} className="space-y-4">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-base text-slate-800 mb-4">Header Info</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <SearchableSelect
                            label="Supplier"
                            value={form.data.supplier_id}
                            onChange={(e) => form.setData('supplier_id', e.target.value)}
                            options={suppliers.map((item) => ({ value: item.id, label: item.name }))}
                            required
                        />
                        <SearchableSelect
                            label="Warehouse"
                            value={form.data.warehouse_id}
                            onChange={(e) => form.setData('warehouse_id', e.target.value)}
                            options={warehouses.map((item) => ({ value: item.id, label: item.name }))}
                            required
                        />
                        <FloatingInput
                            label="Supplier invoice #"
                            value={form.data.supplier_invoice_number}
                            onChange={(e) => form.setData('supplier_invoice_number', e.target.value)}
                        />
                        <FloatingInput
                            label="Purchase date"
                            type="date"
                            value={form.data.purchase_date}
                            onChange={(e) => form.setData('purchase_date', e.target.value)}
                            required
                        />
                        <FloatingInput
                            label="Due date"
                            type="date"
                            value={form.data.due_date}
                            onChange={(e) => form.setData('due_date', e.target.value)}
                        />
                        <SearchableSelect
                            label="Status"
                            value={form.data.status}
                            onChange={(e) => form.setData('status', e.target.value)}
                            options={[
                                { value: 'draft', label: 'Draft' },
                                { value: 'ordered', label: 'Ordered' },
                                { value: 'received', label: 'Received and post stock' }
                            ]}
                            required
                        />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-base text-slate-800">Items</h2>
                        <button
                            type="button"
                            onClick={() => {
                                const lastItem = form.data.items[form.data.items.length - 1];
                                const nextLineBatch = lastItem ? incrementStringNumber(lastItem.batch_number) : (nextBatchNumber ?? '');
                                form.setData('items', [
                                    ...form.data.items,
                                    { product_variant_id: variants[0]?.id ?? '', quantity: '', unit_cost: '', batch_number: nextLineBatch, expires_at: '' }
                                ]);
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            + Add Line
                        </button>
                    </div>

                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-2 pr-3 w-[35%]">Product & Variant</th>
                                    <th className="py-2 px-2 w-[12%]">Qty</th>
                                    <th className="py-2 px-2 w-[15%]">Cost (PKR)</th>
                                    <th className="py-2 px-2 w-[15%]">Batch #</th>
                                    <th className="py-2 pl-2 w-[18%]">Expiry Date</th>
                                    <th className="py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {form.data.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50">
                                        <td className="py-2 pr-3">
                                            <SearchableSelect
                                                id={`item-${index}-variant`}
                                                name={`item-${index}-variant`}
                                                value={item.product_variant_id}
                                                onChange={(e) => setItem(index, 'product_variant_id', e.target.value)}
                                                options={variants.map((v) => ({ value: v.id, label: `${v.product.name} (${v.name}) · ${v.sku}` }))}
                                                required
                                                dense
                                                empty="Search variant..."
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                step="any"
                                                value={item.quantity}
                                                onChange={(e) => setItem(index, 'quantity', e.target.value)}
                                                required
                                                placeholder="Qty"
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                step="any"
                                                value={item.unit_cost}
                                                onChange={(e) => setItem(index, 'unit_cost', e.target.value)}
                                                required
                                                placeholder="Cost"
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="text"
                                                value={item.batch_number}
                                                onChange={(e) => setItem(index, 'batch_number', e.target.value)}
                                                placeholder="Batch #"
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                                            />
                                        </td>
                                        <td className="py-2 pl-2">
                                            <input
                                                type="date"
                                                value={item.expires_at}
                                                onChange={(e) => setItem(index, 'expires_at', e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                                            />
                                        </td>
                                        <td className="py-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => form.setData('items', form.data.items.filter((_, i) => i !== index))}
                                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                title="Remove Line"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <FloatingInput
                            label="Discount total"
                            type="number"
                            step="any"
                            value={form.data.discount_total}
                            onChange={(e) => form.setData('discount_total', e.target.value)}
                        />
                        <FloatingInput
                            label="Tax total"
                            type="number"
                            step="any"
                            value={form.data.tax_total}
                            onChange={(e) => form.setData('tax_total', e.target.value)}
                        />
                        <FloatingInput
                            label="Shipping total"
                            type="number"
                            step="any"
                            value={form.data.shipping_total}
                            onChange={(e) => form.setData('shipping_total', e.target.value)}
                        />
                    </div>

                    {/* Compact Notes Textarea */}
                    <div className="relative mt-4 w-full">
                        <textarea
                            id="notes"
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder=" "
                            className="peer block w-full rounded-xl border border-slate-200 bg-white px-4 pb-2 pt-5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 min-h-16"
                        />
                        <label
                            htmlFor="notes"
                            className="absolute left-4 top-2 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-xs text-slate-400 duration-150 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
                        >
                            Notes
                        </label>
                    </div>
                </section>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                        Save purchase
                    </button>
                    <Link
                        href="/purchases"
                        className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
