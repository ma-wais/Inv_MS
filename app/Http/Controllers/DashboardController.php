<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Branch;
use App\Models\Warehouse;
use App\Support\Tenancy\TenantContext;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(TenantContext $tenantContext): Response
    {
        $tenant = $tenantContext->get();

        return Inertia::render('Dashboard', [
            'summary' => [
                'branches' => Branch::query()->where('is_active', true)->count(),
                'warehouses' => Warehouse::query()->where('is_active', true)->count(),
                'accounts' => Account::query()->where('is_active', true)->count(),
                'users' => $tenant->users()->count(),
            ],
            'branches' => Branch::query()
                ->where('is_active', true)
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'is_default']),
        ]);
    }
}
