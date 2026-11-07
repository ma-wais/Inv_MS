<?php

namespace App\Http\Controllers;

use App\Services\Reporting\DashboardReportService;
use App\Support\ReportPeriod;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, TenantContext $context, DashboardReportService $reports): Response
    {
        $tenant = $context->get();
        $period = ReportPeriod::fromRequest($request, $tenant->timezone);
        $overview = $reports->overview($period);
        $admin = $request->user()->hasPermission('accounting.manage', $tenant);
        if (! $admin) {
            unset($overview['summary']['cash'], $overview['summary']['receivables'], $overview['summary']['expenses'], $overview['charts']['expenses']);
        }

        return Inertia::render('Dashboard', [...$overview, 'filters' => $period,
            'branches' => $tenant->branches()->where('is_active', true)->get(['id', 'name', 'code', 'is_default']),
        ]);
    }

    public function metric(Request $request, string $metric, TenantContext $context, DashboardReportService $reports): Response
    {
        abort_unless(array_key_exists($metric, DashboardReportService::TITLES), 404);
        $tenant = $context->get();
        if (in_array($metric, ['cash', 'receivables', 'expenses'])) {
            abort_unless($request->user()->hasPermission('accounting.manage', $tenant), 403);
        }
        $period = ReportPeriod::fromRequest($request, $tenant->timezone);
        $account = $metric === 'cash' ? '1100' : '1300';

        return Inertia::render('Reporting/DashboardMetric', [
            'metric' => $metric, 'title' => DashboardReportService::TITLES[$metric], 'filters' => $period, 'rows' => $reports->rows($metric, $period),
            'opening_balance' => in_array($metric, ['cash', 'receivables']) ? $reports->accountBalance($account, $period['end_date'], $period['start_date']) : null,
            'closing_balance' => in_array($metric, ['cash', 'receivables']) ? $reports->accountBalance($account, $period['end_date']) : null,
        ]);
    }
}
