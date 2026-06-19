<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Permission;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
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
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'shop_name' => ['required', 'string', 'max:255'],
            'shop_slug' => ['required', 'string', 'alpha_dash', 'max:255', 'unique:tenants,slug'],
            'phone' => ['nullable', 'string', 'max:255'],
            'currency' => ['required', 'string', 'max:3'],
            'timezone' => ['required', 'string', 'max:255'],
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
                'role' => 'owner',
                'is_default' => true,
            ]);

            // 4. Seed Branch & Warehouse
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

            // 5. Seed Units
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

            // 6. Seed Roles & Link Permissions
            $ownerRole = $tenant->roles()->create([
                'name' => 'Owner',
                'slug' => 'owner',
                'is_system' => true,
            ]);
            
            $permissions = Permission::all();
            $ownerRole->permissions()->sync($permissions->pluck('id'));

            // 7. Seed Chart of Accounts
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
