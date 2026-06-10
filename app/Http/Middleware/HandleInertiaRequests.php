<?php

namespace App\Http\Middleware;

use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            'auth' => [
                'user' => $user,
                'tenant' => $tenantContext->get(),
                'role' => $user && $tenantContext->has()
                    ? $user->roleFor($tenantContext->id())
                    : null,
                'tenants' => $user
                    ? $user->tenants()
                        ->where('tenants.status', 'active')
                        ->get(['tenants.id', 'tenants.name'])
                    : [],
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
