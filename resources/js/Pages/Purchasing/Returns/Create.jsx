import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Create({ purchase }) {
    const form = useForm({
        return_date: new Date().toISOString().slice(0, 10),
        notes: '',
        items: purchase.items.map((item) => ({
            purchase_item_id: item.id,
            quantity: '',
        })),
    });

    function submit(event) {
        event.preventDefault();
        form.post(`/purchases/${purchase.id}/returns`);
    }

    function setItem(index, field, value) {
        const items = [...form.data.items];
        items[index] = { ...items[index], [field]: value };
        form.setData('items', items);
    }

    return (
        <AuthenticatedLayout title={`Return ${purchase.number}`}>
            <Head title={`Return ${purchase.number}`} />

            <form onSubmit={submit} className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Return date"><Input type="date" value={form.data.return_date} onChange={(v) => form.setData('return_date', v)} /></Field>
                    </div>
                    <div className="mt-6 space-y-4">
                        {purchase.items.map((item, index) => (
                            <div key={item.id} className="grid gap-3 rounded-xl border border-slate-100 p-4 lg:grid-cols-4">
                                <div>
                                    <p className="font-medium">{item.variant.product.name}</p>
                                    <p className="text-xs text-slate-400">{item.variant.sku}</p>
                                    <p className="text-xs text-slate-400">Received: {item.received_quantity}</p>
                                </div>
                                <Input type="number" step="any" value={form.data.items[index].quantity} onChange={(v) => setItem(index, 'quantity', v)} placeholder="Return qty" />
                                <div className="text-sm text-slate-500">Cost: {money(item.unit_cost)}</div>
                                <div className="text-sm text-slate-500">Max return: {money(Number(item.received_quantity) - Number(item.returned_quantity))}</div>
                            </div>
                        ))}
                    </div>
                    <label className="mt-5 block text-sm font-medium">
                        Notes
                        <textarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} className={`${inputClass} min-h-24`} />
                    </label>
                </section>

                <div className="flex gap-3">
                    <button disabled={form.processing} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">Post return</button>
                    <Link href={`/purchases/${purchase.id}`} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold">Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function Field({ label, children }) { return <label className="block text-sm font-medium">{label}{children}</label>; }
function Input({ value, onChange, type = 'text', step, placeholder }) { return <input type={type} step={step} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />; }
function money(value) { return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500';
