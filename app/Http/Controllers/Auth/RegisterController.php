<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\ShopProvisioningService;
use App\Support\ContactFields;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        ContactFields::normalize($request);
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'shop_name' => ['required', 'string', 'max:255'],
            'shop_slug' => ['required', 'string', 'alpha_dash', 'max:255', 'unique:tenants,slug'],
            'phone' => ContactFields::phoneRules(),
            'currency' => ['required', 'string', 'max:3'],
            'timezone' => ['required', 'timezone'],
        ]);

        $user = DB::transaction(function () use ($request) {
            // 1. Create Tenant
            $tenant = Tenant::create([
                'name' => $request->shop_name,
                'slug' => $request->shop_slug,
                'phone' => $request->phone,
                'currency' => $request->currency,
                'timezone' => $request->timezone,
                'status' => 'active',
            ]);

            // 2. Create User
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_super_admin' => false,
            ]);

            // 3. Link User to Tenant
            $tenant->users()->attach($user->id, [
                'role' => 'admin',
                'is_default' => true,
            ]);

            app(ShopProvisioningService::class)->provision($tenant);

            return $user;
        });

        Auth::login($user);

        // Fetch user default tenant to write to session
        $tenant = $user->tenants()->first();
        if ($tenant) {
            $request->session()->put('tenant_id', $tenant->id);
        }

        return redirect()->route('dashboard');
    }
}
