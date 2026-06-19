<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminController extends Controller
{
    public function index(): Response
    {
        $tenants = Tenant::query()
            ->orderBy('name')
            ->get()
            ->map(function (Tenant $tenant) {
                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'phone' => $tenant->phone ?? '—',
                    'currency' => $tenant->currency,
                    'timezone' => $tenant->timezone,
                    'status' => $tenant->status,
                    'products_count' => Product::withoutGlobalScopes()->where('tenant_id', $tenant->id)->count(),
                    'users_count' => DB::table('tenant_user')->where('tenant_id', $tenant->id)->count(),
                ];
            });

        return Inertia::render('SuperAdmin/TenantsList', [
            'tenants' => $tenants,
        ]);
    }

    public function toggleStatus(Tenant $tenant, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,suspended'],
        ]);

        $tenant->update([
            'status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'Shop status updated successfully.');
    }
}
