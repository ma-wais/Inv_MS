<?php

namespace Tests\Feature\Maintenance;

use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProductionSetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_seeder_adds_only_permissions_and_demo_is_explicitly_blocked_in_production(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        $this->artisan('db:seed', ['--force' => true])->assertSuccessful();
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('tenants', 0);
        $this->assertDatabaseCount('products', 0);
        $this->assertDatabaseCount('accounts', 0);
        $this->assertDatabaseCount('permissions', 8);
        $this->expectException(\RuntimeException::class);
        (new DemoSeeder)->run();
    }

    public function test_interactive_platform_admin_creation_and_duplicate_email_preserve_existing_account(): void
    {
        $password = 'AdminTesting123!';
        $prompt = 'Password (at least 12 characters, uppercase/lowercase and numbers)';
        $this->artisan('ventory:admin new.admin@example.test')->expectsQuestion($prompt, $password)
            ->expectsQuestion('Confirm password', $password)->assertSuccessful();
        $admin = User::where('email', 'new.admin@example.test')->firstOrFail();
        $this->assertTrue($admin->is_super_admin);
        $this->assertTrue(Hash::check($password, $admin->password));
        $this->artisan('ventory:admin new.admin@example.test')->expectsQuestion($prompt, 'DifferentAdmin123!')
            ->expectsQuestion('Confirm password', 'DifferentAdmin123!')->assertFailed();
        $this->assertTrue(Hash::check($password, $admin->refresh()->password));
        $this->assertDatabaseCount('users', 1);
    }
}
