<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Support\Auditing\Audit;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantSelectionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = $user->is_super_admin
            ? Tenant::query()->where('status', 'active')->orderBy('name')
            : $user->tenants()->where('tenants.status', 'active')->orderByPivot('is_default', 'desc');

        return Inertia::render('Tenants/Select', [
            'tenants' => $query->get(['tenants.id', 'tenants.name', 'tenants.slug', 'tenants.currency']),
        ]);
    }

    public function update(
        Request $request,
        Tenant $tenant,
        TenantContext $tenantContext,
        Audit $audit,
    ): RedirectResponse {
        $user = $request->user();

        if ($user->is_super_admin) {
            $authorizedTenant = Tenant::query()
                ->where('id', $tenant->id)
                ->where('status', 'active')
                ->firstOrFail();
        } else {
            $authorizedTenant = $user->tenants()
                ->where('tenants.id', $tenant->id)
                ->where('tenants.status', 'active')
                ->firstOrFail();
        }

        $request->session()->put('tenant_id', $authorizedTenant->id);
        $tenantContext->set($authorizedTenant);
        $audit->record('tenant.switched', $authorizedTenant);

        return redirect()->route('dashboard');
    }
}
