<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\Sales\SaleService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleReturnController extends Controller
{
    public function create(Sale $sale): Response
    {
        return Inertia::render('Sales/Returns/Create', [
            'sale' => $sale->load(['customer', 'warehouse', 'items.variant.product.baseUnit']),
        ]);
    }

    public function store(Request $request, Sale $sale, SaleService $saleService, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'return_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sale_item_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
        ]);

        $return = $saleService->createReturn($sale, $validated, $validated['items']);
        $audit->record('sale.return.created', $return, null, $return->toArray());

        return redirect()->route('sales.show', $sale)->with('status', 'Sale return posted.');
    }
}
