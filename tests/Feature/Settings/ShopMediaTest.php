<?php

namespace Tests\Feature\Settings;

use App\Models\ShopMedia;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ShopMediaTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private TenantContext $context;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Media Shop',
            'slug' => 'media-shop',
        ]);

        $this->user = User::create([
            'name' => 'Owner',
            'email' => 'owner@test.local',
            'password' => Hash::make('password'),
            'is_super_admin' => true,
        ]);

        $this->tenant->users()->attach($this->user->id, ['role' => 'owner', 'is_default' => true]);

        $this->context = app(TenantContext::class);
        $this->context->set($this->tenant);
    }

    public function test_authenticated_user_can_upload_and_delete_image(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('shop_front.jpg', 100, 'image/jpeg');

        // Upload post
        $response = $this->actingAs($this->user)
            ->withSession(['tenant_id' => $this->tenant->id])
            ->post('/settings/media', [
                'file' => $file,
                'label' => 'Shop',
                'description' => 'Main store front',
            ]);

        $response->assertRedirect();
        
        // Assert database record exists
        $this->assertDatabaseHas('shop_media', [
            'tenant_id' => $this->tenant->id,
            'filename' => 'shop_front.jpg',
            'label' => 'Shop',
            'description' => 'Main store front',
        ]);

        $media = ShopMedia::where('filename', 'shop_front.jpg')->firstOrFail();
        
        // Assert file exists on public disk
        Storage::disk('public')->assertExists($media->path);

        // Delete post
        $response2 = $this->actingAs($this->user)
            ->withSession(['tenant_id' => $this->tenant->id])
            ->delete("/settings/media/{$media->id}");

        $response2->assertRedirect();

        // Assert database record deleted
        $this->assertDatabaseMissing('shop_media', ['id' => $media->id]);

        // Assert file deleted from public disk
        Storage::disk('public')->assertMissing($media->path);
    }

    public function test_guest_is_blocked_from_media_gallery(): void
    {
        $response = $this->get('/settings/media');
        $response->assertRedirect('/login');
    }
}
