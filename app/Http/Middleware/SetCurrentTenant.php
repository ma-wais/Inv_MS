<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentTenant
{
    public function __construct(private readonly TenantContext $tenantContext) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $this->tenantContext->clear();
        abort_unless($user && ($user->status ?? 'active') === 'active', 403);
        $tenantId = $request->session()->get('tenant_id');

        if ($user->is_super_admin) {
            $tenant = null;
            if ($tenantId) {
                $tenant = Tenant::where('id', $tenantId)->where('status', 'active')->first();
            }
            if (! $tenant) {
                $tenant = $user->tenants()->where('tenants.status', 'active')->first();
            }
            if (! $tenant) {
                return redirect()->route('super-admin.tenants.index');
            }
        } else {
            $tenant = $user->tenants()
                ->where('tenants.status', 'active')
                ->when($tenantId, fn ($query) => $query->where('tenants.id', $tenantId))
                ->first();

            if ($tenant === null && $tenantId !== null) {
                $request->session()->forget('tenant_id');
            }

            $tenant ??= $user->tenants()
                ->where('tenants.status', 'active')
                ->orderByPivot('is_default', 'desc')
                ->first();

            if ($tenant === null) {
                return redirect()->route('tenants.select');
            }
        }

        $request->session()->put('tenant_id', $tenant->id);
        $this->tenantContext->set($tenant);

        return $next($request);
    }
}
