<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\ShopProvisioningService;
use App\Support\ContactFields;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminController extends Controller
{
    public function index(): Response
    {
        $tenants = Tenant::query()
            ->orderBy('name')
            ->get()
            ->map(function (Tenant $tenant) {
                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'phone' => $tenant->phone ?? '—',
                    'currency' => $tenant->currency,
                    'timezone' => $tenant->timezone,
                    'status' => $tenant->status,
                    'products_count' => Product::withoutGlobalScopes()->where('tenant_id', $tenant->id)->count(),
                    'users_count' => DB::table('tenant_user')->where('tenant_id', $tenant->id)->count(),
                ];
            });

        return Inertia::render('SuperAdmin/TenantsList', [
            'tenants' => $tenants,
        ]);
    }

    public function storeTenant(Request $request): RedirectResponse
    {
        ContactFields::normalize($request);
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'alpha_dash', 'max:255', 'unique:tenants,slug'],
            'phone' => ContactFields::phoneRules(),
            'currency' => ['required', 'string', 'max:3'],
            'timezone' => ['required', 'timezone'],
        ]);

        DB::transaction(function () use ($request) {
            // 1. Create Tenant
            $tenant = Tenant::create([
                'name' => $request->name,
                'slug' => $request->slug,
                'phone' => $request->phone,
                'currency' => $request->currency,
                'timezone' => $request->timezone,
                'status' => 'active',
            ]);

            app(ShopProvisioningService::class)->provision($tenant);
        });

        return redirect()->back()->with('status', 'Shop registered and initialized successfully.');
    }

    public function updateTenant(Tenant $tenant, Request $request): RedirectResponse
    {
        ContactFields::normalize($request);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ContactFields::phoneRules(),
            'currency' => ['required', 'string', 'max:3'],
            'timezone' => ['required', 'timezone'],
        ]);

        $tenant->update($validated);

        return redirect()->back()->with('status', 'Shop details updated successfully.');
    }

    public function toggleStatus(Tenant $tenant, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,suspended'],
        ]);

        $tenant->update([
            'status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'Shop status updated successfully.');
    }

    public function usersIndex(): Response
    {
        $users = User::query()
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_super_admin' => $user->is_super_admin,
                    'tenants' => $user->tenants->map(function ($t) {
                        return [
                            'id' => $t->id,
                            'name' => $t->name,
                            'role' => $t->pivot->role,
                        ];
                    }),
                ];
            });

        $tenants = Tenant::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('SuperAdmin/UsersList', [
            'users' => $users,
            'tenants' => $tenants,
        ]);
    }

    public function usersStore(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Rules\Password::defaults()],
            'is_super_admin' => ['required', 'boolean'],
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_super_admin' => $request->is_super_admin,
        ]);

        return redirect()->back()->with('status', 'User created successfully.');
    }

    public function usersUpdate(User $user, Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', Rules\Password::defaults()],
            'is_super_admin' => ['required', 'boolean'],
        ]);

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'is_super_admin' => $request->is_super_admin,
        ];

        if ($request->password) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return redirect()->back()->with('status', 'User details updated successfully.');
    }

    public function usersDestroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->withErrors(['error' => 'You cannot delete yourself.']);
        }

        $user->delete();

        return redirect()->back()->with('status', 'User deleted successfully.');
    }

    public function linkTenant(User $user, Request $request): RedirectResponse
    {
        $request->validate([
            'tenant_id' => ['required', 'exists:tenants,id'],
            'role' => ['required', 'string', 'in:admin,worker'],
        ]);

        $user->tenants()->syncWithoutDetaching([
            $request->tenant_id => ['role' => $request->role],
        ]);

        return redirect()->back()->with('status', 'User linked to shop successfully.');
    }

    public function unlinkTenant(User $user, Tenant $tenant): RedirectResponse
    {
        $user->tenants()->detach($tenant->id);

        return redirect()->back()->with('status', 'User unlinked from shop successfully.');
    }
}
