import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

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
        // Filter out items with no return quantity to only post items being returned
        const payload = {
            ...form.data,
            items: form.data.items.filter(item => Number(item.quantity) > 0)
        };
        
        if (payload.items.length === 0) {
            alert('Please specify a quantity to return for at least one item.');
            return;
        }

        form.setData('items', payload.items);
        
        // Short timeout to let state update or post directly with payload
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

            <form onSubmit={submit} className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Return date"><Input type="date" value={form.data.return_date} onChange={(v) => form.setData('return_date', v)} /></Field>
                    </div>
                    <div className="mt-6 space-y-4">
                        {sale.items.map((item, index) => {
                            const returnable = Number(item.quantity) - Number(item.returned_quantity);
                            const itemIndex = form.data.items.findIndex(i => i.sale_item_id === item.id);
                            
                            return (
                                <div key={item.id} className="grid gap-3 rounded-xl border border-slate-100 p-4 lg:grid-cols-4 items-center">
                                    <div>
                                        <p className="font-medium">{item.variant.product.name}</p>
                                        <p className="text-xs text-slate-400">{item.variant.sku}</p>
                                        <p className="text-xs text-slate-400">Sold quantity: {qty(item.quantity)}</p>
                                    </div>
                                    <Input 
                                        type="number" 
                                        step="any" 
                                        value={itemIndex > -1 ? form.data.items[itemIndex].quantity : ''} 
                                        onChange={(v) => setItem(itemIndex, 'quantity', v)} 
                                        placeholder="Return qty" 
                                        max={returnable}
                                    />
                                    <div className="text-sm text-slate-500">Price: {money(item.unit_price)}</div>
                                    <div className="text-sm text-slate-500">Max returnable: {qty(returnable)}</div>
                                </div>
                            );
                        })}
                    </div>
                    <label className="mt-5 block text-sm font-medium">
                        Notes
                        <textarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} className={`${inputClass} min-h-24`} />
                    </label>
                </section>

                <div className="flex gap-3">
                    <button disabled={form.processing} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">Post return</button>
                    <Link href={`/sales/${sale.id}`} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold">Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function Field({ label, children }) { return <label className="block text-sm font-medium">{label}{children}</label>; }
function Input({ value, onChange, type = 'text', step, placeholder, max }) { return <input type={type} step={step} placeholder={placeholder} max={max} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />; }
function money(value) { return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function qty(value) { return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 }); }
const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500';
