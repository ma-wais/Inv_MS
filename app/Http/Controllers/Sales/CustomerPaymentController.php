<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\Sales\SaleService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CustomerPaymentController extends Controller
{
    public function store(Request $request, Customer $customer, SaleService $saleService, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'sale_id' => ['nullable', 'integer'],
            'account_id' => ['nullable', 'integer'],
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'method' => ['required', 'string', 'max:50'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $payment = $saleService->recordPayment($customer, $validated);
        $audit->record('customer.payment.created', $payment, null, $payment->toArray());

        return back()->with('status', 'Customer payment recorded.');
    }
}
