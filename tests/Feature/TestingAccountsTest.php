<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TestingAccountsTest extends TestCase
{
    use RefreshDatabase;

    public function test_testing_accounts_can_log_in_and_rerunning_preserves_passwords_and_data(): void
    {
        $this->artisan('ventory:testing-accounts')->assertSuccessful();
        $tenant = Tenant::where('slug', 'ventory-testing')->firstOrFail();
        $this->assertSame(14, $tenant->accounts()->count());
        $this->assertSame(8, $tenant->units()->count());
        foreach (['admin', 'worker'] as $role) {
            $user = User::where('email', "testing.{$role}@ventory.test")->firstOrFail();
            $this->assertSame($role, $user->roleFor($tenant));
            $this->post('/login', ['email' => $user->email, 'password' => 'VentoryTest123!'])->assertRedirect('/dashboard');
            $this->assertAuthenticatedAs($user);
            $this->post('/logout');
        }
        $user->update(['password' => 'ChangedPassword123!']);
        $this->artisan('ventory:testing-accounts')->assertSuccessful();
        $this->assertTrue(Hash::check('ChangedPassword123!', $user->refresh()->password));
        $this->assertDatabaseCount('tenants', 1);
        $this->assertDatabaseCount('users', 3);
        $this->assertDatabaseCount('sales', 0);
        $this->assertDatabaseCount('journal_entries', 0);
    }

    public function test_testing_command_rejects_production_and_conflicting_existing_accounts(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        $this->artisan('ventory:testing-accounts')->assertFailed();
        $this->assertDatabaseCount('tenants', 0);
        $this->app->detectEnvironment(fn () => 'testing');
        User::create(['name' => 'Existing Admin', 'email' => 'testing.admin@ventory.test', 'password' => 'existing-password', 'is_super_admin' => true]);
        $this->artisan('ventory:testing-accounts')->assertFailed();
        $this->assertDatabaseCount('tenants', 0);
        $this->assertTrue(Hash::check('existing-password', User::first()->password));
    }
}
