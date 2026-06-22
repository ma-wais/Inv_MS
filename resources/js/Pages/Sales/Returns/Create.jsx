import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../../Components/FloatingInput';

export default function Create({ sale }) {
    const form = useForm({
        return_date: new Date().toISOString().slice(0, 10),
        notes: '',
        items: sale.items.map((item) => ({
            sale_item_id: item.id,
            quantity: '',
        })),
    });

    function submit(event) {
        event.preventDefault();
        const payload = {
            ...form.data,
            items: form.data.items.filter(item => Number(item.quantity) > 0)
        };
        
        if (payload.items.length === 0) {
            alert('Please specify a quantity to return for at least one item.');
            return;
        }

        form.setData('items', payload.items);
        router.post(`/sales/${sale.id}/returns`, payload);
    }

    function setItem(index, field, value) {
        const items = [...form.data.items];
        items[index] = { ...items[index], [field]: value };
        form.setData('items', items);
    }

    return (
        <AuthenticatedLayout title={`Return ${sale.number}`}>
            <Head title={`Return ${sale.number}`} />

            <form onSubmit={submit} className="space-y-4">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FloatingInput
                            label="Return Date"
                            type="date"
                            value={form.data.return_date}
                            onChange={(e) => form.setData('return_date', e.target.value)}
                            required
                            error={form.errors.return_date}
                        />
                    </div>

                    <div className="mt-4 space-y-3">
                        {sale.items.map((item, index) => {
                            const returnable = Number(item.quantity) - Number(item.returned_quantity);
                            const itemIndex = form.data.items.findIndex(i => i.sale_item_id === item.id);
                            
                            return (
                                <div key={item.id} className="grid gap-3 rounded-xl border border-slate-100 p-4 lg:grid-cols-4 items-center bg-slate-50/30">
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{item.variant.product.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.variant.sku}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Sold Qty: {qty(item.quantity)}</p>
                                    </div>
                                    <FloatingInput
                                        label="Return Qty"
                                        type="number"
                                        step="any"
                                        max={returnable}
                                        value={itemIndex > -1 ? form.data.items[itemIndex].quantity : ''}
                                        onChange={(e) => setItem(itemIndex, 'quantity', e.target.value)}
                                        required
                                    />
                                    <div className="text-xs text-slate-500 font-medium">Price: PKR {money(item.unit_price)}</div>
                                    <div className="text-xs text-slate-500 font-medium">Max Returnable: {qty(returnable)}</div>
                                </div>
                            );
                        })}
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
                        {form.errors.notes && <p className="mt-1 text-xs text-red-600">{form.errors.notes}</p>}
                    </div>
                </section>

                <div className="flex gap-3">
                    <button disabled={form.processing} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer">Post return</button>
                    <Link href={`/sales/${sale.id}`} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function money(value) {
    return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function qty(value) {
    return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 });
}
