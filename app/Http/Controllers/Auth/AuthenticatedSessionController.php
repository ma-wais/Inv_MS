<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request, Audit $audit): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt([...$credentials, 'status' => 'active'], $request->boolean('remember'))) {
            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ])->onlyInput('email');
        }

        $request->session()->regenerate();
        $audit->record('auth.login');

        $user = $request->user();

        if ($user->is_super_admin) {
            return redirect()->intended(route('super-admin.tenants.index'));
        }

        $tenant = $user->tenants()
            ->where('tenants.status', 'active')
            ->orderByPivot('is_default', 'desc')
            ->first();

        if ($tenant) {
            $request->session()->put('tenant_id', $tenant->id);
        }

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(Request $request, Audit $audit): RedirectResponse
    {
        $audit->record('auth.logout');

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
