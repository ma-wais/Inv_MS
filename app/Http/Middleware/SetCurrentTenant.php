<?php

namespace App\Http\Middleware;

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
        $tenantId = $request->session()->get('tenant_id');

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

        $request->session()->put('tenant_id', $tenant->id);
        $this->tenantContext->set($tenant);

        return $next($request);
    }
}
