<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\Sales\CustomerLedgerService;
use App\Support\Auditing\Audit;
use App\Support\ContactFields;
use Illuminate\Http\JsonResponse;
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
        if (! in_array($direction, ['asc', 'desc'])) {
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
            'customers' => $query->withLedgerTotals()->paginate(20)->withQueryString(),
            'filters' => [
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    public function store(Request $request, Audit $audit): RedirectResponse
    {
        $this->createCustomer($request, $audit);

        return back()->with('status', 'Customer created.');
    }

    public function quickStore(Request $request, Audit $audit): JsonResponse
    {
        $customer = $this->createCustomer($request, $audit);

        return response()->json(['customer' => $customer->only(['id', 'name', 'phone'])], 201);
    }

    private function createCustomer(Request $request, Audit $audit): Customer
    {
        ContactFields::normalize($request);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ContactFields::phoneRules(),
            'cnic' => ContactFields::cnicRules(),
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

        return $customer;
    }

    public function show(Customer $customer, CustomerLedgerService $ledger): Response
    {
        return Inertia::render('Sales/Customers/Show', [
            'customer' => $customer->loadCount(['sales', 'payments', 'returns']),
            'ledger' => $ledger->entries($customer),
            'sales' => $customer->sales()
                ->withReturnTotals()
                ->with(['warehouse:id,name'])
                ->latest('sale_date')
                ->get(),
            'payments' => $customer->payments()->latest('payment_date')->get(),
            'returns' => $customer->returns()->latest('return_date')->get(),
        ]);
    }

    public function edit(Customer $customer): Response
    {
        return Inertia::render('Contacts/Edit', [
            'kind' => 'customers', 'contact' => $customer,
            'has_history' => $customer->sales()->exists() || $customer->payments()->exists() || $customer->returns()->exists(),
        ]);
    }

    public function update(Request $request, Customer $customer, Audit $audit): RedirectResponse
    {
        ContactFields::normalize($request);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ContactFields::phoneRules(), 'cnic' => ContactFields::cnicRules(),
            'address' => ['nullable', 'string', 'max:2000'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'opening_balance' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string', 'max:5000'], 'is_active' => ['required', 'boolean'],
        ]);
        if (isset($validated['opening_balance']) && (float) $validated['opening_balance'] !== (float) $customer->opening_balance
            && ($customer->sales()->exists() || $customer->payments()->exists() || $customer->returns()->exists())) {
            return back()->withErrors(['opening_balance' => 'Opening balance cannot be changed after transactions have been recorded.']);
        }
        $old = $customer->only(array_keys($validated));
        $customer->update($validated);
        $audit->record('customer.updated', $customer, $old, $customer->only(array_keys($validated)));

        return redirect()->route('customers.show', $customer)->with('status', 'Customer updated.');
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
