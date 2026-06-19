<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\Sales\CustomerLedgerService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Sales/Customers/Index', [
            'customers' => Customer::query()
                ->withCount(['sales', 'payments', 'returns'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'opening_balance' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
        ]);

        $customer = Customer::create([
            ...$validated,
            'code' => $this->uniqueCode($validated['name']),
        ]);

        $audit->record('customer.created', $customer, null, $customer->toArray());

        return back()->with('status', 'Customer created.');
    }

    public function show(Customer $customer, CustomerLedgerService $ledger): Response
    {
        return Inertia::render('Sales/Customers/Show', [
            'customer' => $customer->loadCount(['sales', 'payments', 'returns']),
            'ledger' => $ledger->entries($customer),
            'sales' => $customer->sales()
                ->with(['warehouse:id,name'])
                ->latest('sale_date')
                ->get(),
            'payments' => $customer->payments()->latest('payment_date')->get(),
            'returns' => $customer->returns()->latest('return_date')->get(),
        ]);
    }

    private function uniqueCode(string $name): string
    {
        $base = strtoupper(Str::slug($name, ''));
        $base = substr($base, 0, 8) ?: 'CUS';
        $code = $base;
        $suffix = 2;

        while (Customer::query()->where('code', $code)->exists()) {
            $code = $base.$suffix;
            $suffix++;
        }

        return $code;
    }
}
