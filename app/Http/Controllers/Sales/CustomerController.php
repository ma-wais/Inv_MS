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
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');
        if (!in_array($direction, ['asc', 'desc'])) {
            $direction = 'asc';
        }

        $query = Customer::query()
            ->withCount(['sales', 'payments', 'returns'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('contact_person', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
            });

        if (in_array($sort, ['name', 'sales_count', 'payments_count', 'opening_balance', 'code'])) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('name', $direction);
        }

        return Inertia::render('Sales/Customers/Index', [
            'customers' => $query->get(),
            'filters' => [
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
            ]
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

    public function destroy(Customer $customer, Audit $audit): RedirectResponse
    {
        if ($customer->code === 'WALKIN' || strtolower($customer->name) === 'walk-in customer') {
            return back()->withErrors(['error' => 'The default Walk-in Customer cannot be deleted.']);
        }

        if ($customer->sales()->exists() || $customer->payments()->exists() || $customer->returns()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete customer because they have transaction history.']);
        }

        $audit->record('customer.deleted', $customer, $customer->toArray(), null);
        $customer->delete();

        return redirect()->route('customers.index')->with('status', 'Customer deleted.');
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
