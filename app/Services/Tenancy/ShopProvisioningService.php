<?php

namespace App\Services\Tenancy;

use App\Models\Category;
use App\Models\Permission;
use App\Models\Tenant;
use App\Support\ShopRole;
use App\Support\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;

class ShopProvisioningService
{
    public const UNITS = [
        ['Piece', 'pc', false], ['Liter', 'L', true], ['Kilogram', 'kg', true],
        ['Gram', 'g', true], ['Milliliter', 'ml', true], ['Meter', 'm', true],
        ['Gallon', 'gal', true], ['Box', 'box', false],
    ];

    public const ACCOUNTS = [
        ['1000', 'Assets', 'asset', 'debit', null], ['2000', 'Liabilities', 'liability', 'credit', null],
        ['3000', 'Equity', 'equity', 'credit', null], ['4000', 'Income', 'income', 'credit', null],
        ['5000', 'Expenses', 'expense', 'debit', null],
        ['1100', 'Cash on Hand', 'asset', 'debit', '1000'], ['1200', 'Bank Account', 'asset', 'debit', '1000'],
        ['1300', 'Accounts Receivable', 'asset', 'debit', '1000'], ['1400', 'Inventory', 'asset', 'debit', '1000'],
        ['2100', 'Accounts Payable', 'liability', 'credit', '2000'], ['4100', 'Sales Revenue', 'income', 'credit', '4000'],
        ['5100', 'Cost of Goods Sold', 'expense', 'debit', '5000'], ['5200', 'Operating Expenses', 'expense', 'debit', '5000'],
        ['5300', 'Staff Salaries', 'expense', 'debit', '5000'],
    ];

    public function provision(Tenant $tenant, bool $createLocation = true): void
    {
        $context = app(TenantContext::class);
        $previous = $context->get();
        $context->set($tenant);
        try {
            DB::transaction(function () use ($tenant, $createLocation) {
                if ($createLocation) {
                    $branch = $tenant->branches()->firstOrCreate(['code' => 'MAIN'], ['name' => 'Main Branch', 'is_default' => true]);
                    $branch->warehouses()->firstOrCreate(['code' => 'MAIN-WH'], ['tenant_id' => $tenant->id, 'name' => 'Main Warehouse', 'is_default' => true]);
                }
                foreach (self::UNITS as [$name, $symbol, $decimal]) {
                    $tenant->units()->firstOrCreate(['symbol' => $symbol], ['name' => $name, 'allows_decimal' => $decimal]);
                }
                Category::firstOrCreate(['tenant_id' => $tenant->id, 'slug' => 'general'], ['name' => 'General']);
                foreach (['admin' => ShopRole::PERMISSIONS, 'worker' => ShopRole::WORKER_PERMISSIONS] as $role => $permissions) {
                    $record = $tenant->roles()->firstOrCreate(['slug' => $role], ['name' => ucfirst($role), 'is_system' => true]);
                    $ids = [];
                    foreach ($permissions as $permission) {
                        $ids[] = Permission::firstOrCreate(['slug' => $permission], ['name' => ucfirst(str_replace('.', ' ', $permission)), 'group' => explode('.', $permission)[0]])->id;
                    }
                    $record->permissions()->sync($ids);
                }
                $ids = [];
                foreach (self::ACCOUNTS as [$code, $name, $type, $normal, $parent]) {
                    $ids[$code] = $tenant->accounts()->firstOrCreate(['code' => $code], [
                        'name' => $name, 'type' => $type, 'normal_balance' => $normal,
                        'parent_id' => $parent ? $ids[$parent] : null, 'is_system' => true,
                    ])->id;
                }
            });
        } finally {
            $previous ? $context->set($previous) : $context->clear();
        }
    }
}
