<?php

namespace App\Http\Controllers;

use App\Support\Auditing\Audit;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopSettingsController extends Controller
{
    public function edit(TenantContext $tenantContext): Response
    {
        return Inertia::render('Settings/Shop', [
            'shop' => $tenantContext->get()->only([
                'name',
                'legal_name',
                'email',
                'phone',
                'currency',
                'timezone',
            ]),
        ]);
    }

    public function update(Request $request, TenantContext $tenantContext, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'currency' => ['required', 'string', 'size:3'],
            'timezone' => ['required', 'timezone'],
        ]);

        $tenant = $tenantContext->get();
        $oldValues = $tenant->only(array_keys($validated));
        $tenant->update($validated);

        $audit->record('shop.settings.updated', $tenant, $oldValues, $tenant->only(array_keys($validated)));

        return back()->with('status', 'Shop settings updated.');
    }
}
