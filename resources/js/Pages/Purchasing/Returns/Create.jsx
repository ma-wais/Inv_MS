import { returnCredit } from '../../../Components/invoiceAmounts';
import { today } from '../../../Components/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../../Components/FloatingInput';

export default function Create({ purchase }) {
    const form = useForm({
        return_date: today(),
        notes: '',
        items: purchase.items.map((item) => ({
            purchase_item_id: item.id,
            quantity: '',
        })),
    });

    function submit(event) {
        event.preventDefault();
        if (!form.data.items.some(item => Number(item.quantity) > 0)) {
            form.setError('items', 'Enter a quantity for at least one item.');
            return;
        }
        form.transform(data => ({ ...data, items: data.items.filter(item => Number(item.quantity) > 0) }));
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

            <form onSubmit={submit} className="space-y-4">
                {form.errors.items && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger-ink">{form.errors.items}</p>}
                <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
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
                        {purchase.items.map((item, index) => (
                            <div key={item.id} className="grid gap-3 rounded-xl border border-line-soft p-4 lg:grid-cols-4 items-center bg-surface-muted/30">
                                <div>
                                    <p className="font-semibold text-foreground text-sm">{item.variant.product.name}</p>
                                    <p className="text-[10px] text-subtle font-mono mt-0.5">{item.variant.sku}</p>
                                    <p className="text-[10px] text-muted mt-0.5">Received Qty: {item.received_quantity}</p>
                                </div>
                                <FloatingInput
                                    label="Return Qty"
                                    type="number"
                                    step={item.variant.product.base_unit?.allows_decimal ? 'any' : '1'}
                                    min="0"
                                    max={Number(item.received_quantity) - Number(item.returned_quantity)}
                                    disabled={Number(item.received_quantity) <= Number(item.returned_quantity)}
                                    aria-label={`${item.variant.sku} return quantity`}
                                    value={form.data.items[index].quantity}
                                    onChange={(e) => setItem(index, 'quantity', e.target.value)}
                                />
                                <div className="text-xs text-muted font-medium">Estimated credit: PKR {money(returnCredit(item, form.data.items[index].quantity))}</div>
                                <div className="text-xs text-muted font-medium">Max Returnable: {Number(item.received_quantity) - Number(item.returned_quantity)}</div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-4 rounded-xl bg-success-soft p-3 text-sm text-success-ink">Estimated return credit: PKR {money(purchase.items.reduce((total, item, index) => total + returnCredit(item, form.data.items[index]?.quantity), 0))}. Invoice discounts, tax and shipping are included proportionally.</p>

                    {/* Compact Notes Textarea */}
                    <div className="relative mt-4 w-full">
                        <textarea
                            id="notes"
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder=" "
                            className="peer block w-full rounded-xl border border-line bg-surface px-4 pb-2 pt-5 text-sm text-foreground outline-none transition-all focus:border-emerald-500 min-h-16"
                        />
                        <label
                            htmlFor="notes"
                            className="absolute left-4 top-2 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-xs text-subtle duration-150 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
                        >
                            Notes
                        </label>
                        {form.errors.notes && <p className="mt-1 text-xs text-danger-ink">{form.errors.notes}</p>}
                    </div>
                </section>

                <div className="flex gap-3">
                    <button disabled={form.processing} className="rounded-xl bg-action px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer">Post return</button>
                    <Link href={`/purchases/${purchase.id}`} className="rounded-xl border border-line bg-surface px-6 py-3 text-sm font-semibold hover:bg-surface-muted transition-colors">Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function money(value) {
    return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
