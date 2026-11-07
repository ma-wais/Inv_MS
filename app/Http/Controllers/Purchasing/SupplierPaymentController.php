<?php

namespace App\Http\Controllers\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Services\Purchasing\PurchaseService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class SupplierPaymentController extends Controller
{
    public function store(Request $request, Supplier $supplier, PurchaseService $purchaseService, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'purchase_id' => ['nullable', 'integer'],
            'account_id' => ['nullable', 'integer'],
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'method' => ['required', 'in:cash,bank,card,mobile'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        try {
            $payment = $purchaseService->recordPayment($supplier, $validated);
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['amount' => $exception->getMessage()]);
        }
        $audit->record('supplier.payment.created', $payment, null, $payment->toArray());

        return back()->with('status', 'Supplier payment recorded.');
    }
}
