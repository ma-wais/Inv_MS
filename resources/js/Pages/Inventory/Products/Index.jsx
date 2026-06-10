import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Index({ products, filters }) {
    function search(event) {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('search');
        router.get('/products', { search: value }, { preserveState: true });
    }

    return (
        <AuthenticatedLayout title="Products">
            <Head title="Products" />

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <form onSubmit={search} className="flex max-w-lg flex-1 gap-2">
                    <input name="search" defaultValue={filters.search} placeholder="Search name, SKU, or barcode" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                    <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold">Search</button>
                </form>
                <Link href="/products/create" className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700">
                    Add product
                </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-5 py-4">Product</th>
                                <th className="px-5 py-4">Category / Brand</th>
                                <th className="px-5 py-4">Variants</th>
                                <th className="px-5 py-4">Current stock</th>
                                <th className="px-5 py-4">Unit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.data.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-5 py-4">
                                        <Link href={`/products/${product.id}`} className="font-medium text-emerald-700 hover:underline">{product.name}</Link>
                                        <p className="text-xs capitalize text-slate-400">{product.product_type}</p>
                                    </td>
                                    <td className="px-5 py-4 text-slate-600">
                                        {product.category?.name ?? 'Uncategorized'} / {product.brand?.name ?? 'No brand'}
                                    </td>
                                    <td className="px-5 py-4">{product.variants_count}</td>
                                    <td className="px-5 py-4 font-semibold">{formatQuantity(product.stock_quantity)}</td>
                                    <td className="px-5 py-4">{product.base_unit.symbol}</td>
                                </tr>
                            ))}
                            {products.data.length === 0 && (
                                <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-400">No products found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination links={products.links} />
            </div>
        </AuthenticatedLayout>
    );
}

function Pagination({ links }) {
    return (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4">
            {links.map((link, index) => (
                <Link key={index} href={link.url ?? '#'} preserveScroll className={`rounded-lg px-3 py-1.5 text-sm ${link.active ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}>
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                </Link>
            ))}
        </div>
    );
}

function formatQuantity(quantity) {
    return Number(quantity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 });
}
