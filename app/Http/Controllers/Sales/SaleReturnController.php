<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Services\Sales\SaleService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class SaleReturnController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Sales/Returns/Index', [
            'returns' => SaleReturn::query()
                ->with(['customer:id,name', 'sale:id,number', 'warehouse:id,name'])
                ->latest('return_date')
                ->paginate(20),
        ]);
    }

    public function create(Sale $sale): Response
    {
        return Inertia::render('Sales/Returns/Create', [
            'sale' => $sale->load(['items' => fn ($query) => $query->withSum('returnItems as credited_total', 'line_total'), 'customer', 'warehouse', 'items.variant.product.baseUnit']),
        ]);
    }

    public function store(Request $request, Sale $sale, SaleService $saleService, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'return_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sale_item_id' => ['required', 'integer', 'distinct'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
        ]);

        try {
            $return = $saleService->createReturn($sale, $validated, $validated['items']);
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['items' => $exception->getMessage()]);
        }
        $audit->record('sale.return.created', $return, null, $return->toArray());

        return redirect()->route('sales.show', $sale)->with('status', 'Sale return posted.');
    }

    public function show(int $id): Response
    {
        $return = SaleReturn::query()
            ->with([
                'customer',
                'warehouse',
                'sale:id,number',
                'items.variant.product.baseUnit',
            ])
            ->findOrFail($id);

        return Inertia::render('Sales/Returns/Show', [
            'returnDoc' => $return,
        ]);
    }
}
