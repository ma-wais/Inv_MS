<?php

namespace Tests\Feature\Settings;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ShopBrandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_logo_upload_replace_remove_and_worker_access_are_shop_scoped(): void
    {
        Storage::fake('public');
        $tenant = Tenant::create(['name' => 'Branding Shop', 'slug' => 'branding']);
        $other = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        $admin = User::factory()->create();
        $tenant->users()->attach($admin->id, ['role' => 'admin']);
        $this->actingAs($admin)->withSession(['tenant_id' => $tenant->id]);
        $data = ['_method' => 'PUT', 'name' => $tenant->name, 'legal_name' => '', 'email' => '', 'phone' => '', 'currency' => 'PKR', 'timezone' => 'Asia/Karachi', 'enabled_reports' => []];
        $this->post('/settings/shop', [...$data, 'logo' => UploadedFile::fake()->image('shop.png')])->assertSessionHasNoErrors();
        $first = $tenant->refresh()->logo_path;
        Storage::disk('public')->assertExists($first);
        $this->assertStringStartsWith('shops/'.$tenant->id.'/logos/', $first);
        $this->assertNull($other->refresh()->logo_path);
        $this->post('/settings/shop', [...$data, 'logo' => UploadedFile::fake()->image('replacement.png')])->assertSessionHasNoErrors();
        Storage::disk('public')->assertMissing($first);
        $second = $tenant->refresh()->logo_path;
        $this->post('/settings/shop', [...$data, 'logo' => UploadedFile::fake()->create('unsafe.svg', 10, 'image/svg+xml')])->assertSessionHasErrors('logo');
        $this->assertSame($second, $tenant->refresh()->logo_path);
        $this->post('/settings/shop', [...$data, 'remove_logo' => true])->assertSessionHasNoErrors();
        Storage::disk('public')->assertMissing($second);
        $this->assertNull($tenant->refresh()->logo_url);
        $tenant->users()->updateExistingPivot($admin->id, ['role' => 'worker']);
        $this->post('/settings/shop', $data)->assertForbidden();
    }
}
