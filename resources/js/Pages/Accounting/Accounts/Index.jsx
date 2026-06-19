import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Index({ accounts }) {
    const { flash } = usePage().props;
    const form = useForm({
        parent_id: '',
        code: '',
        name: '',
        type: 'asset',
        normal_balance: 'debit',
        description: '',
    });

    function submit(event) {
        event.preventDefault();
        form.post('/accounts', { preserveScroll: true, onSuccess: () => form.reset() });
    }

    // Filter root level accounts
    const rootAccounts = accounts.filter(a => !a.parent_id);

    return (
        <AuthenticatedLayout title="Chart of Accounts">
            <Head title="Chart of Accounts" />

            {flash.status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.status}</div>}

            <section className="grid gap-6 xl:grid-cols-3">
                {/* Form to create account */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
                    <h2 className="font-semibold text-slate-800">Add Account</h2>
                    <form onSubmit={submit} className="mt-4 space-y-3">
                        <label className="block text-sm font-medium text-slate-700">
                            Parent Account (Optional)
                            <select 
                                value={form.data.parent_id} 
                                onChange={(e) => form.setData('parent_id', e.target.value)} 
                                className={inputClass}
                            >
                                <option value="">No Parent (Root Category)</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                ))}
                            </select>
                            {form.errors.parent_id && <span className="mt-1 block text-xs text-red-600">{form.errors.parent_id}</span>}
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Account Code
                            <input 
                                type="text" 
                                required 
                                value={form.data.code} 
                                onChange={(e) => form.setData('code', e.target.value)} 
                                className={inputClass} 
                                placeholder="e.g. 1100"
                            />
                            {form.errors.code && <span className="mt-1 block text-xs text-red-600">{form.errors.code}</span>}
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Account Name
                            <input 
                                type="text" 
                                required 
                                value={form.data.name} 
                                onChange={(e) => form.setData('name', e.target.value)} 
                                className={inputClass} 
                                placeholder="e.g. Cash on Hand"
                            />
                            {form.errors.name && <span className="mt-1 block text-xs text-red-600">{form.errors.name}</span>}
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Account Type
                            <select 
                                value={form.data.type} 
                                onChange={(e) => form.setData('type', e.target.value)} 
                                className={inputClass}
                            >
                                <option value="asset">Asset</option>
                                <option value="liability">Liability</option>
                                <option value="equity">Equity</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                            {form.errors.type && <span className="mt-1 block text-xs text-red-600">{form.errors.type}</span>}
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Normal Balance
                            <select 
                                value={form.data.normal_balance} 
                                onChange={(e) => form.setData('normal_balance', e.target.value)} 
                                className={inputClass}
                            >
                                <option value="debit">Debit</option>
                                <option value="credit">Credit</option>
                            </select>
                            {form.errors.normal_balance && <span className="mt-1 block text-xs text-red-600">{form.errors.normal_balance}</span>}
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Description
                            <textarea 
                                value={form.data.description} 
                                onChange={(e) => form.setData('description', e.target.value)} 
                                className={`${inputClass} min-h-20`} 
                            />
                            {form.errors.description && <span className="mt-1 block text-xs text-red-600">{form.errors.description}</span>}
                        </label>

                        <button 
                            disabled={form.processing} 
                            className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            Create Account
                        </button>
                    </form>
                </div>

                {/* Tree View Table */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <h2 className="font-semibold text-slate-800">Chart of Accounts</h2>
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Code</th>
                                    <th>Account Name</th>
                                    <th>Type</th>
                                    <th>Normal Balance</th>
                                    <th>Origin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rootAccounts.map(root => (
                                    <React.Fragment key={root.id}>
                                        {/* Root Account row */}
                                        <tr className="bg-slate-50/50 font-bold">
                                            <td className="px-4 py-3 text-slate-900">{root.code}</td>
                                            <td className="text-slate-900">{root.name}</td>
                                            <td className="capitalize text-slate-600">{root.type}</td>
                                            <td className="capitalize text-slate-600">{root.normal_balance}</td>
                                            <td><span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold uppercase">System</span></td>
                                        </tr>
                                        {/* Children of this root */}
                                        {accounts.filter(a => a.parent_id === root.id).map(child => (
                                            <tr key={child.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 pl-8 text-slate-600 font-medium">{child.code}</td>
                                                <td className="text-slate-800 font-semibold">{child.name}</td>
                                                <td className="capitalize text-slate-500">{child.type}</td>
                                                <td className="capitalize text-slate-500">{child.normal_balance}</td>
                                                <td>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                                                        child.is_system ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {child.is_system ? 'System' : 'Custom'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white';
