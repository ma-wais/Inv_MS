import { Head, Link, useForm } from '@inertiajs/react';

export default function Login() {
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(event) {
        event.preventDefault();
        form.post('/login', {
            onFinish: () => form.reset('password'),
        });
    }

    return (
        <>
            <Head title="Login" />
            <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
                <section className="hidden flex-col justify-between p-12 text-white lg:flex">
                    <Link href="/" className="text-xl font-bold text-emerald-300">
                        Ventory
                    </Link>
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Welcome back</p>
                        <h1 className="mt-4 max-w-xl text-5xl font-bold tracking-tight">
                            Your shop, stock, sales, and accounts in one place.
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500">English-first with PKR and Pakistan timezone defaults.</p>
                </section>

                <section className="flex items-center justify-center bg-white px-6 py-12">
                    <form onSubmit={submit} className="w-full max-w-md">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">Ventory login</p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight">Sign in to continue</h2>
                        <p className="mt-2 text-sm text-slate-500">Use the owner account created by the database seeder.</p>

                        <label className="mt-8 block text-sm font-medium">
                            Email
                            <input
                                type="email"
                                value={form.data.email}
                                onChange={(event) => form.setData('email', event.target.value)}
                                autoComplete="email"
                                autoFocus
                                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                            />
                        </label>
                        {form.errors.email && <p className="mt-1 text-sm text-red-600">{form.errors.email}</p>}

                        <label className="mt-5 block text-sm font-medium">
                            Password
                            <input
                                type="password"
                                value={form.data.password}
                                onChange={(event) => form.setData('password', event.target.value)}
                                autoComplete="current-password"
                                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                            />
                        </label>
                        {form.errors.password && <p className="mt-1 text-sm text-red-600">{form.errors.password}</p>}

                        <label className="mt-5 flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={form.data.remember}
                                onChange={(event) => form.setData('remember', event.target.checked)}
                                className="rounded border-slate-300"
                            />
                            Remember me
                        </label>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="mt-7 w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {form.processing ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </section>
            </main>
        </>
    );
}
