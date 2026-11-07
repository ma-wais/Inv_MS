<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\ShopRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'phone', 'cnic', 'password', 'is_super_admin', 'status', 'image_path'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
        ];
    }

    public function tenants()
    {
        return $this->belongsToMany(Tenant::class)
            ->withPivot(['role', 'is_default'])
            ->withTimestamps();
    }

    public function roleFor(Tenant|int $tenant): ?string
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;

        return ShopRole::normalize($this->tenants()
            ->where('tenants.id', $tenantId)
            ->first()
            ?->pivot
            ?->role);
    }

    public function hasPermission(string $permission, ?Tenant $tenant): bool
    {
        if ($this->is_super_admin) {
            return true;
        }

        if ($tenant === null) {
            return false;
        }

        $role = $this->roleFor($tenant);

        return in_array($permission, $role === ShopRole::ADMIN
            ? ShopRole::PERMISSIONS
            : ($role === ShopRole::WORKER ? ShopRole::WORKER_PERMISSIONS : []), true);
    }
}
