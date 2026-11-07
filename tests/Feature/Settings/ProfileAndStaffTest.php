<?php

namespace Tests\Feature\Settings;

use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProfileAndStaffTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = Tenant::create(['name' => 'Shop', 'slug' => 'shop']);
        $this->admin = User::factory()->create(['password' => 'old-password']);
        $this->tenant->users()->attach($this->admin, ['role' => 'admin', 'is_default' => true]);
        $this->actingAs($this->admin)->withSession(['tenant_id' => $this->tenant->id]);
    }

    public function test_worker_can_use_operations_but_cannot_manage_staff_settings_or_accounting(): void
    {
        $worker = User::factory()->create();
        $this->tenant->users()->attach($worker, ['role' => 'worker']);
        $this->actingAs($worker);
        foreach (['/customers', '/suppliers', '/products', '/stock', '/profile'] as $url) {
            $this->get($url)->assertOk();
        }
        foreach (['/settings/staff', '/settings/shop', '/accounts', '/super-admin/users'] as $url) {
            $this->get($url)->assertForbidden();
        }
        $this->post('/settings/staff', [])->assertForbidden();
    }

    public function test_contact_formats_are_normalized_and_invalid_values_are_rejected(): void
    {
        foreach (['0300-1234567', '+92 300 1234567', '0092 300 1234567'] as $phone) {
            $this->put('/profile', [
                'name' => $this->admin->name, 'email' => $this->admin->email,
                'phone' => $phone, 'cnic' => '35202-1234567-1',
            ])->assertSessionHasNoErrors();
            $this->assertDatabaseHas('users', ['id' => $this->admin->id, 'phone' => '+923001234567', 'cnic' => '3520212345671']);
        }
        $this->put('/profile', [
            'name' => 'Invalid', 'email' => $this->admin->email, 'phone' => '0300ABC1234567', 'cnic' => '1234',
        ])->assertSessionHasErrors(['phone', 'cnic']);
        $this->assertNotSame('Invalid', $this->admin->fresh()->name);
    }

    public function test_profile_photo_upload_replace_and_remove_clean_up_files(): void
    {
        Storage::fake('public');
        $fields = ['name' => $this->admin->name, 'email' => $this->admin->email];
        $this->post('/profile', [...$fields, '_method' => 'PUT', 'image' => UploadedFile::fake()->image('avatar.png')])
            ->assertSessionHasNoErrors();
        $first = $this->admin->fresh()->image_path;
        Storage::disk('public')->assertExists($first);
        $this->post('/profile', [...$fields, '_method' => 'PUT', 'image' => UploadedFile::fake()->image('replacement.png')])
            ->assertSessionHasNoErrors();
        $second = $this->admin->fresh()->image_path;
        Storage::disk('public')->assertMissing($first);
        Storage::disk('public')->assertExists($second);
        $this->put('/profile', [...$fields, 'remove_image' => true])->assertSessionHasNoErrors();
        $this->assertNull($this->admin->fresh()->image_path);
        Storage::disk('public')->assertMissing($second);
    }

    public function test_password_change_requires_current_password_and_does_not_require_profile_fields(): void
    {
        $fields = ['password' => 'new-password', 'password_confirmation' => 'new-password'];
        $this->put('/profile/password', [...$fields, 'current_password' => 'wrong'])->assertSessionHasErrors('current_password');
        $this->assertTrue(Hash::check('old-password', $this->admin->fresh()->password));
        $this->put('/profile/password', [...$fields, 'current_password' => 'old-password'])->assertSessionHasNoErrors();
        $this->assertTrue(Hash::check('new-password', $this->admin->fresh()->password));
    }

    public function test_staff_creation_uses_worker_role_and_validated_contacts(): void
    {
        $this->post('/settings/staff', [
            'name' => 'Worker', 'email' => 'worker@example.test', 'password' => 'password123',
            'role' => 'worker', 'existing_user' => false, 'phone' => '0312 1234567', 'cnic' => '35202-1234567-1',
        ])->assertSessionHasNoErrors();
        $worker = User::where('email', 'worker@example.test')->firstOrFail();
        $this->assertSame('worker', $worker->roleFor($this->tenant));
        $this->assertSame('+923121234567', $worker->phone);
    }

    public function test_last_admin_cannot_be_demoted_or_remove_themselves(): void
    {
        $this->put("/settings/staff/{$this->admin->id}", ['role' => 'worker'])->assertSessionHasErrors('role');
        $this->assertSame('admin', $this->admin->roleFor($this->tenant));
        $this->delete("/settings/staff/{$this->admin->id}")->assertSessionHasErrors('error');
    }

    public function test_linking_an_existing_user_does_not_modify_their_global_profile(): void
    {
        Storage::fake('public');
        $existing = User::factory()->create(['name' => 'Original', 'cnic' => '3520212345671']);
        $this->post('/settings/staff', [
            'email' => $existing->email, 'role' => 'worker', 'existing_user' => true,
            'name' => 'Changed', 'cnic' => '1234567890123', 'image' => UploadedFile::fake()->image('changed.png'),
        ])->assertSessionHasNoErrors();
        $this->assertSame('Original', $existing->fresh()->name);
        $this->assertNull($existing->fresh()->image_path);
        $this->assertSame('3520212345671', $existing->fresh()->cnic);
        $this->assertCount(0, Storage::disk('public')->allFiles());
    }

    public function test_staff_mutations_are_scoped_to_the_selected_shop(): void
    {
        $other = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        $otherWorker = User::factory()->create();
        $other->users()->attach($otherWorker, ['role' => 'worker']);
        $this->put("/settings/staff/{$otherWorker->id}", ['role' => 'admin'])->assertNotFound();
        $this->delete("/settings/staff/{$otherWorker->id}")->assertNotFound();
        $this->assertSame('worker', $otherWorker->roleFor($other));
    }

    public function test_cnic_is_not_in_shared_authentication_props(): void
    {
        $this->admin->update(['cnic' => '3520212345671']);
        $this->get('/customers')->assertInertia(fn (Assert $page) => $page
            ->where('auth.role', 'admin')->missing('auth.user.cnic')->missing('auth.user.password'));
    }

    public function test_customer_route_binding_does_not_expose_another_shops_customer(): void
    {
        $other = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        $customer = Customer::withoutGlobalScopes()->create([
            'tenant_id' => $other->id, 'name' => 'Private Customer', 'code' => 'PRIVATE',
        ]);
        $this->get("/customers/{$customer->id}")->assertNotFound();
        $this->post("/customers/{$customer->id}/payments", ['amount' => 100])->assertNotFound();
        $this->delete("/customers/{$customer->id}")->assertNotFound();
        $this->assertDatabaseHas('customers', ['id' => $customer->id]);
    }

    public function test_customers_and_suppliers_can_be_created_and_edited_with_formatted_contacts(): void
    {
        foreach (['customers' => Customer::class, 'suppliers' => Supplier::class] as $path => $model) {
            $fields = ['name' => 'Contact', 'phone' => '0300 1234567', 'cnic' => '35202-1234567-1', 'opening_balance' => 25];
            $this->post("/{$path}", $fields)->assertSessionHasNoErrors();
            $contact = $model::where('name', 'Contact')->firstOrFail();
            $this->get("/{$path}/{$contact->id}/edit")->assertOk();
            $this->put("/{$path}/{$contact->id}", [...$fields, 'name' => 'Updated', 'phone' => '0312-1234567', 'is_active' => true])
                ->assertSessionHasNoErrors()->assertRedirect("/{$path}/{$contact->id}");
            $this->assertDatabaseHas($path, ['id' => $contact->id, 'name' => 'Updated', 'phone' => '+923121234567', 'cnic' => '3520212345671']);
        }
    }

    public function test_contact_lists_are_paginated_and_include_opening_balances(): void
    {
        for ($index = 0; $index < 25; $index++) {
            Customer::create(['tenant_id' => $this->tenant->id, 'name' => sprintf('Customer %02d', $index), 'code' => "C{$index}", 'opening_balance' => 25]);
        }
        $this->get('/customers')->assertInertia(fn (Assert $page) => $page
            ->has('customers.data', 20)->where('customers.total', 25)->where('customers.data.0.ledger_balance', 25));
    }

    public function test_pos_customer_creation_returns_a_scoped_customer_and_json_validation_errors(): void
    {
        $this->postJson('/pos/customers', ['name' => 'Quick Customer', 'phone' => '0312-1234567', 'cnic' => '35202-1234567-1'])
            ->assertCreated()->assertJsonPath('customer.name', 'Quick Customer')->assertJsonPath('customer.phone', '+923121234567');
        $this->assertDatabaseHas('customers', ['name' => 'Quick Customer', 'tenant_id' => $this->tenant->id, 'cnic' => '3520212345671']);
        $this->postJson('/pos/customers', ['name' => '', 'phone' => '123', 'cnic' => '123'])
            ->assertUnprocessable()->assertJsonValidationErrors(['name', 'phone', 'cnic']);
        $this->assertDatabaseCount('customers', 1);
    }
}
