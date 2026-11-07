<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\ShopProvisioningService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class PrepareTestingAccounts extends Command
{
    protected $signature = 'ventory:testing-accounts';

    protected $description = 'Prepare an isolated local shop and admin/worker accounts for manual testing';

    public function handle(TenantContext $context): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('Testing accounts can only be created in local or testing environments.');

            return self::FAILURE;
        }
        $previous = $context->get();
        try {
            $rows = DB::transaction(function () use ($context) {
                $tenant = Tenant::firstOrCreate(['slug' => 'ventory-testing'], [
                    'name' => 'Ventory Testing Shop', 'currency' => 'PKR', 'timezone' => 'Asia/Karachi', 'status' => 'active',
                ]);
                if ($tenant->name !== 'Ventory Testing Shop' || $tenant->status !== 'active') {
                    throw new RuntimeException('The testing shop slug is already in use or suspended. No account changes were made.');
                }
                $context->set($tenant);
                $branch = $tenant->branches()->firstOrCreate(['code' => 'TEST'], ['name' => 'Testing Branch', 'is_default' => true]);
                $branch->warehouses()->firstOrCreate(['code' => 'TEST-WH'], ['tenant_id' => $tenant->id, 'name' => 'Testing Warehouse', 'is_default' => true]);
                app(ShopProvisioningService::class)->provision($tenant, createLocation: false);
                $rows = [];
                foreach (['admin', 'worker'] as $role) {
                    $email = "testing.{$role}@ventory.test";
                    $user = User::firstOrCreate(['email' => $email], [
                        'name' => 'Testing '.ucfirst($role), 'password' => 'VentoryTest123!', 'is_super_admin' => false, 'status' => 'active',
                    ]);
                    if ($user->is_super_admin || $user->status !== 'active' || $user->tenants()->where('tenants.id', '!=', $tenant->id)->exists()) {
                        throw new RuntimeException("{$email} already belongs to a different account context. No account changes were made.");
                    }
                    $tenant->users()->syncWithoutDetaching([$user->id => ['role' => $role, 'is_default' => true]]);
                    $rows[] = [ucfirst($role), $email, Hash::check('VentoryTest123!', $user->password) ? 'VentoryTest123!' : 'Existing password preserved'];
                }

                $system = User::firstOrCreate(['email' => 'testing.system@ventory.test'], [
                    'name' => 'Testing System Admin', 'password' => 'VentoryTest123!', 'is_super_admin' => true, 'status' => 'active',
                ]);
                if (! $system->is_super_admin || $system->status !== 'active' || $system->tenants()->exists()) {
                    throw new RuntimeException('The testing system email already belongs to a different account context. No changes were made.');
                }
                $rows[] = ['Platform admin', $system->email, Hash::check('VentoryTest123!', $system->password) ? 'VentoryTest123!' : 'Existing password preserved'];

                return $rows;
            });
            $this->info('Ventory Testing Shop is ready. Existing passwords and business data were preserved.');
            $this->table(['Role', 'Email', 'Password'], $rows);

            return self::SUCCESS;
        } catch (RuntimeException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        } finally {
            $previous ? $context->set($previous) : $context->clear();
        }
    }
}
