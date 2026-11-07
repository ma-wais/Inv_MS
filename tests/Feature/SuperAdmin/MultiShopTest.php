<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\Account;
use App\Models\Branch;
use App\Models\Permission;
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
        Permission::create(['name' => 'View dashboard', 'slug' => 'dashboard.view', 'group' => 'dashboard']);
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
        $this->assertSame('admin', $user->roleFor($tenant));

        // Assert branch & warehouse seeding
        $this->assertDatabaseHas('branches', ['tenant_id' => $tenant->id, 'code' => 'MAIN']);
        $this->assertDatabaseHas('warehouses', ['tenant_id' => $tenant->id, 'code' => 'MAIN-WH']);

        // Assert standard units seeding
        $this->assertSame(8, Unit::where('tenant_id', $tenant->id)->count());
        $this->assertDatabaseHas('units', ['tenant_id' => $tenant->id, 'symbol' => 'pc']);
        $this->assertDatabaseHas('units', ['tenant_id' => $tenant->id, 'symbol' => 'L']);
        foreach (['g', 'ml', 'm'] as $symbol) {
            $this->assertDatabaseHas('units', ['tenant_id' => $tenant->id, 'symbol' => $symbol]);
        }
        $this->assertSame(['admin', 'worker'], $tenant->roles()->orderBy('slug')->pluck('slug')->all());
        $this->assertDatabaseHas('categories', ['tenant_id' => $tenant->id, 'slug' => 'general']);
        $this->assertDatabaseCount('products', 0);
        $this->assertDatabaseCount('brands', 0);

        // Assert Chart of Accounts seeding
        $this->assertSame(14, Account::where('tenant_id', $tenant->id)->count()); // 5 headers + 9 default accounts
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

        $tenant->users()->attach($user->id, ['role' => 'worker', 'is_default' => true]);

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

    public function test_super_admin_can_create_and_update_tenant(): void
    {
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@test.local',
            'password' => Hash::make('password'),
            'is_super_admin' => true,
        ]);

        // Create Tenant
        $response = $this->actingAs($superAdmin)
            ->post('/super-admin/tenants', [
                'name' => 'Fancy Store',
                'slug' => 'fancy-store',
                'phone' => '+923001234567',
                'currency' => 'USD',
                'timezone' => 'America/New_York',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tenants', [
            'name' => 'Fancy Store',
            'slug' => 'fancy-store',
            'phone' => '+923001234567',
            'currency' => 'USD',
            'timezone' => 'America/New_York',
        ]);

        $tenant = Tenant::where('slug', 'fancy-store')->firstOrFail();

        // Assert defaults seeded
        $this->assertDatabaseHas('branches', ['tenant_id' => $tenant->id, 'name' => 'Main Branch']);
        $this->assertDatabaseHas('warehouses', ['tenant_id' => $tenant->id, 'name' => 'Main Warehouse']);
        $this->assertDatabaseHas('units', ['tenant_id' => $tenant->id, 'symbol' => 'pc']);
        $this->assertDatabaseHas('accounts', ['tenant_id' => $tenant->id, 'code' => '1100', 'name' => 'Cash on Hand']);

        // Update Tenant
        $response2 = $this->actingAs($superAdmin)
            ->put("/super-admin/tenants/{$tenant->id}", [
                'name' => 'Fancy Store Updated',
                'phone' => '+923111234567',
                'currency' => 'EUR',
                'timezone' => 'UTC',
            ]);

        $response2->assertRedirect();
        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'name' => 'Fancy Store Updated',
            'phone' => '+923111234567',
            'currency' => 'EUR',
            'timezone' => 'UTC',
        ]);
    }

    public function test_super_admin_can_manage_users_and_shop_linkage(): void
    {
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@test.local',
            'password' => Hash::make('password'),
            'is_super_admin' => true,
        ]);

        // Get users list
        $response = $this->actingAs($superAdmin)->get('/super-admin/users');
        $response->assertOk();

        // Create User
        $response2 = $this->actingAs($superAdmin)
            ->post('/super-admin/users', [
                'name' => 'Shop Manager',
                'email' => 'manager@test.local',
                'password' => 'password123',
                'is_super_admin' => false,
            ]);

        $response2->assertRedirect();
        $this->assertDatabaseHas('users', [
            'name' => 'Shop Manager',
            'email' => 'manager@test.local',
            'is_super_admin' => false,
        ]);

        $newUser = User::where('email', 'manager@test.local')->firstOrFail();

        // Update User
        $response3 = $this->actingAs($superAdmin)
            ->put("/super-admin/users/{$newUser->id}", [
                'name' => 'Shop Manager Updated',
                'email' => 'manager-new@test.local',
                'password' => 'new-password-123',
                'is_super_admin' => true, // Promotion to super admin
            ]);

        $response3->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $newUser->id,
            'name' => 'Shop Manager Updated',
            'email' => 'manager-new@test.local',
            'is_super_admin' => true,
        ]);
        $this->assertTrue(Hash::check('new-password-123', $newUser->fresh()->password));

        // Create a tenant
        $tenant = Tenant::create([
            'name' => 'Test Shop',
            'slug' => 'test-shop',
        ]);

        // Link User to Shop
        $response4 = $this->actingAs($superAdmin)
            ->post("/super-admin/users/{$newUser->id}/tenants", [
                'tenant_id' => $tenant->id,
                'role' => 'worker',
            ]);

        $response4->assertRedirect();
        $this->assertTrue($newUser->tenants()->where('tenants.id', $tenant->id)->exists());
        $this->assertSame('worker', $newUser->roleFor($tenant));

        // Unlink User from Shop
        $response5 = $this->actingAs($superAdmin)
            ->delete("/super-admin/users/{$newUser->id}/tenants/{$tenant->id}");

        $response5->assertRedirect();
        $this->assertFalse($newUser->tenants()->where('tenants.id', $tenant->id)->exists());

        // Delete User
        $response6 = $this->actingAs($superAdmin)
            ->delete("/super-admin/users/{$newUser->id}");

        $response6->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $newUser->id]);
    }

    public function test_super_admin_cannot_delete_themselves(): void
    {
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@test.local',
            'password' => Hash::make('password'),
            'is_super_admin' => true,
        ]);

        $response = $this->actingAs($superAdmin)
            ->delete("/super-admin/users/{$superAdmin->id}");

        $response->assertRedirect();
        $response->assertSessionHasErrors(['error']);
        $this->assertDatabaseHas('users', ['id' => $superAdmin->id]);
    }
}
