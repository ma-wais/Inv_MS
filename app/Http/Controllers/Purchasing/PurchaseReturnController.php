<?php

namespace App\Http\Controllers\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Services\Purchasing\PurchaseService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseReturnController extends Controller
{
    public function create(Purchase $purchase): Response
    {
        return Inertia::render('Purchasing/Returns/Create', [
            'purchase' => $purchase->load(['supplier', 'warehouse', 'items.variant.product.baseUnit']),
        ]);
    }

    public function store(Request $request, Purchase $purchase, PurchaseService $purchaseService, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'return_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
        ]);

        $return = $purchaseService->createReturn($purchase, $validated, $validated['items']);
        $audit->record('purchase.return.created', $return, null, $return->toArray());

        return redirect()->route('purchases.show', $purchase)->with('status', 'Purchase return posted.');
    }
}
