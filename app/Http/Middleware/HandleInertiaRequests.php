<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Support\ShopRole;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $tenantContext = app(TenantContext::class);
        $user = Auth::user();

        return [
            ...parent::share($request),
            'auth' => function () use ($user, $tenantContext) {
                // Route middleware selects the shop after shared props are registered.
                $role = $user && $tenantContext->has() ? $user->roleFor($tenantContext->id()) : null;

                return [
                    'user' => $user ? [
                        ...$user->only(['id', 'name', 'email', 'is_super_admin']),
                        'image_url' => $user->image_path ? Storage::disk('public')->url($user->image_path) : null,
                    ] : null,
                    'tenant' => $tenantContext->get(),
                    'role' => $role,
                    'permissions' => $user?->is_super_admin || $role === ShopRole::ADMIN
                        ? ShopRole::PERMISSIONS
                        : ($role === ShopRole::WORKER ? ShopRole::WORKER_PERMISSIONS : []),
                    'tenants' => $user
                        ? ($user->is_super_admin
                            ? Tenant::where('status', 'active')->orderBy('name')->get(['id', 'name'])
                            : $user->tenants()->where('tenants.status', 'active')->get(['tenants.id', 'tenants.name']))
                        : [],
                ];
            },
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
