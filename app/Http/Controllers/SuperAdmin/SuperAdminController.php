<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
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
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'alpha_dash', 'max:255', 'unique:tenants,slug'],
            'phone' => ['nullable', 'string', 'max:255'],
            'currency' => ['required', 'string', 'max:3'],
            'timezone' => ['required', 'string', 'max:255'],
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

            // 2. Seed Branch & Warehouse
            $branch = $tenant->branches()->create([
                'name' => 'Main Branch',
                'code' => 'MAIN',
                'is_default' => true,
            ]);

            $branch->warehouses()->create([
                'tenant_id' => $tenant->id,
                'name' => 'Main Warehouse',
                'code' => 'MAIN-WH',
                'is_default' => true,
            ]);

            // 3. Seed Units
            collect([
                ['Piece', 'pc', false],
                ['Liter', 'L', true],
                ['Kilogram', 'kg', true],
                ['Gallon', 'gal', true],
                ['Box', 'box', false],
            ])->each(fn (array $unit) => Unit::create([
                'tenant_id' => $tenant->id,
                'name' => $unit[0],
                'symbol' => $unit[1],
                'allows_decimal' => $unit[2],
            ]));

            // 4. Seed Roles & Link Permissions
            $ownerRole = $tenant->roles()->create([
                'name' => 'Owner',
                'slug' => 'owner',
                'is_system' => true,
            ]);
            
            $permissions = Permission::all();
            $ownerRole->permissions()->sync($permissions->pluck('id'));

            // 5. Seed Chart of Accounts
            $parentAccounts = collect([
                ['1000', 'Assets', Account::TYPE_ASSET, 'debit'],
                ['2000', 'Liabilities', Account::TYPE_LIABILITY, 'credit'],
                ['3000', 'Equity', Account::TYPE_EQUITY, 'credit'],
                ['4000', 'Income', Account::TYPE_INCOME, 'credit'],
                ['5000', 'Expenses', Account::TYPE_EXPENSE, 'debit'],
            ])->map(fn (array $account) => $tenant->accounts()->create([
                'code' => $account[0],
                'name' => $account[1],
                'type' => $account[2],
                'normal_balance' => $account[3],
                'is_system' => true,
            ]));

            $assets = $parentAccounts->firstWhere('code', '1000');
            $liabilities = $parentAccounts->firstWhere('code', '2000');
            $income = $parentAccounts->firstWhere('code', '4000');
            $expenses = $parentAccounts->firstWhere('code', '5000');

            $tenant->accounts()->create([
                'parent_id' => $assets->id,
                'code' => '1100',
                'name' => 'Cash on Hand',
                'type' => Account::TYPE_ASSET,
                'normal_balance' => 'debit',
                'is_system' => true,
            ]);
            $tenant->accounts()->create([
                'parent_id' => $assets->id,
                'code' => '1200',
                'name' => 'Bank Account',
                'type' => Account::TYPE_ASSET,
                'normal_balance' => 'debit',
                'is_system' => true,
            ]);
            $tenant->accounts()->create([
                'parent_id' => $assets->id,
                'code' => '1300',
                'name' => 'Accounts Receivable',
                'type' => Account::TYPE_ASSET,
                'normal_balance' => 'debit',
                'is_system' => true,
            ]);
            $tenant->accounts()->create([
                'parent_id' => $assets->id,
                'code' => '1400',
                'name' => 'Inventory',
                'type' => Account::TYPE_ASSET,
                'normal_balance' => 'debit',
                'is_system' => true,
            ]);
            $tenant->accounts()->create([
                'parent_id' => $liabilities->id,
                'code' => '2100',
                'name' => 'Accounts Payable',
                'type' => Account::TYPE_LIABILITY,
                'normal_balance' => 'credit',
                'is_system' => true,
            ]);
            $tenant->accounts()->create([
                'parent_id' => $income->id,
                'code' => '4100',
                'name' => 'Sales Revenue',
                'type' => Account::TYPE_INCOME,
                'normal_balance' => 'credit',
                'is_system' => true,
            ]);
            $tenant->accounts()->create([
                'parent_id' => $expenses->id,
                'code' => '5100',
                'name' => 'Cost of Goods Sold',
                'type' => Account::TYPE_EXPENSE,
                'normal_balance' => 'debit',
                'is_system' => true,
            ]);
            $tenant->accounts()->create([
                'parent_id' => $expenses->id,
                'code' => '5200',
                'name' => 'Operating Expenses',
                'type' => Account::TYPE_EXPENSE,
                'normal_balance' => 'debit',
                'is_system' => true,
            ]);
            $tenant->accounts()->create([
                'parent_id' => $expenses->id,
                'code' => '5300',
                'name' => 'Staff Salaries',
                'type' => Account::TYPE_EXPENSE,
                'normal_balance' => 'debit',
                'is_system' => true,
            ]);
        });

        return redirect()->back()->with('status', 'Shop registered and initialized successfully.');
    }

    public function updateTenant(Tenant $tenant, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'currency' => ['required', 'string', 'max:3'],
            'timezone' => ['required', 'string', 'max:255'],
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
            'role' => ['required', 'string', 'in:owner,manager,cashier,accountant,viewer'],
        ]);

        $user->tenants()->syncWithoutDetaching([
            $request->tenant_id => ['role' => $request->role]
        ]);

        return redirect()->back()->with('status', 'User linked to shop successfully.');
    }

    public function unlinkTenant(User $user, Tenant $tenant): RedirectResponse
    {
        $user->tenants()->detach($tenant->id);

        return redirect()->back()->with('status', 'User unlinked from shop successfully.');
    }
}
