<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\Account;
use App\Models\Branch;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MultiShopTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic permissions globally if any tests require them
        \App\Models\Permission::create(['name' => 'View dashboard', 'slug' => 'dashboard.view', 'group' => 'dashboard']);
    }

    public function test_guest_can_register_new_shop_with_seeded_defaults(): void
    {
        $response = $this->post('/register', [
            'name' => 'John Owner',
            'email' => 'john@test.local',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'shop_name' => 'Super Paint Shop',
            'shop_slug' => 'super-paint-shop',
            'phone' => '1234567890',
            'currency' => 'PKR',
            'timezone' => 'Asia/Karachi',
        ]);

        $response->assertRedirect('/dashboard');

        // Assert database records
        $this->assertDatabaseHas('users', ['email' => 'john@test.local']);
        $this->assertDatabaseHas('tenants', ['slug' => 'super-paint-shop']);

        $tenant = Tenant::where('slug', 'super-paint-shop')->firstOrFail();
        $user = User::where('email', 'john@test.local')->firstOrFail();

        // Assert role assignment
        $this->assertTrue($user->tenants()->where('tenants.id', $tenant->id)->exists());
        $this->assertSame('owner', $user->roleFor($tenant));

        // Assert branch & warehouse seeding
        $this->assertDatabaseHas('branches', ['tenant_id' => $tenant->id, 'code' => 'MAIN']);
        $this->assertDatabaseHas('warehouses', ['tenant_id' => $tenant->id, 'code' => 'MAIN-WH']);

        // Assert standard units seeding
        $this->assertSame(5, Unit::where('tenant_id', $tenant->id)->count());
        $this->assertDatabaseHas('units', ['tenant_id' => $tenant->id, 'symbol' => 'pc']);
        $this->assertDatabaseHas('units', ['tenant_id' => $tenant->id, 'symbol' => 'L']);

        // Assert Chart of Accounts seeding
        $this->assertSame(13, Account::where('tenant_id', $tenant->id)->count()); // 5 headers + 8 default accounts
        $this->assertDatabaseHas('accounts', ['tenant_id' => $tenant->id, 'code' => '1100', 'name' => 'Cash on Hand']);
        $this->assertDatabaseHas('accounts', ['tenant_id' => $tenant->id, 'code' => '4100', 'name' => 'Sales Revenue']);

        // Assert user is authenticated
        $this->assertAuthenticatedAs($user);
    }

    public function test_normal_user_is_blocked_from_super_admin_endpoints(): void
    {
        $tenant = Tenant::create([
            'name' => 'Demo Shop',
            'slug' => 'demo-shop',
        ]);

        $user = User::create([
            'name' => 'Employee',
            'email' => 'employee@test.local',
            'password' => Hash::make('password'),
            'is_super_admin' => false,
        ]);

        $tenant->users()->attach($user->id, ['role' => 'manager', 'is_default' => true]);

        $response = $this->actingAs($user)
            ->withSession(['tenant_id' => $tenant->id])
            ->get('/super-admin/tenants');

        $response->assertStatus(403);
    }

    public function test_super_admin_can_access_tenants_and_toggle_status(): void
    {
        $tenant = Tenant::create([
            'name' => 'Target Shop',
            'slug' => 'target-shop',
            'status' => 'active',
        ]);

        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@test.local',
            'password' => Hash::make('password'),
            'is_super_admin' => true,
        ]);

        // Access index page
        $response = $this->actingAs($superAdmin)
            ->get('/super-admin/tenants');
        $response->assertOk();

        // Suspend tenant
        $response2 = $this->actingAs($superAdmin)
            ->post("/super-admin/tenants/{$tenant->id}/toggle-status", [
                'status' => 'suspended',
            ]);

        $response2->assertRedirect();
        $this->assertSame('suspended', $tenant->fresh()->status);

        // Activate tenant back
        $response3 = $this->actingAs($superAdmin)
            ->post("/super-admin/tenants/{$tenant->id}/toggle-status", [
                'status' => 'active',
            ]);

        $response3->assertRedirect();
        $this->assertSame('active', $tenant->fresh()->status);
    }
}
