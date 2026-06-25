<?php

namespace App\Http\Controllers\Reporting;

use App\Http\Controllers\Controller;
use App\Services\Reporting\OperationalReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OperationalReportController extends Controller
{
    protected OperationalReportService $reportService;

    public function __construct(OperationalReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    public function inventoryValuation(): Response
    {
        $data = $this->reportService->inventoryValuation();

        return Inertia::render('Reporting/Valuation', [
            'reportData' => $data,
        ]);
    }

    public function productProfit(Request $request): Response
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());

        $data = $this->reportService->productProfit($startDate, $endDate);

        return Inertia::render('Reporting/ProductProfit', [
            'reportData' => $data,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    public function expiry(): Response
    {
        $data = $this->reportService->expiryReport();

        return Inertia::render('Reporting/Expiry', [
            'reportData' => $data,
        ]);
    }

    public function receivablesPayables(): Response
    {
        $data = $this->reportService->receivablesPayables();

        return Inertia::render('Reporting/ReceivablesPayables', [
            'receivables' => $data['receivables'],
            'payables' => $data['payables'],
            'total_receivables' => $data['total_receivables'],
            'total_payables' => $data['total_payables'],
        ]);
    }
}
