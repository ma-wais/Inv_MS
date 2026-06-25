<?php

namespace App\Http\Controllers\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Services\Purchasing\SupplierLedgerService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');
        if (!in_array($direction, ['asc', 'desc'])) {
            $direction = 'asc';
        }

        $query = Supplier::query()
            ->withCount(['purchases', 'payments', 'returns'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('contact_person', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
            });

        if (in_array($sort, ['name', 'purchases_count', 'payments_count', 'opening_balance', 'code'])) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('name', $direction);
        }

        return Inertia::render('Purchasing/Suppliers/Index', [
            'suppliers' => $query->get(),
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
            'tax_number' => ['nullable', 'string', 'max:100'],
            'opening_balance' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
        ]);

        $supplier = Supplier::create([
            ...$validated,
            'code' => $this->uniqueCode($validated['name']),
        ]);

        $audit->record('supplier.created', $supplier, null, $supplier->toArray());

        return back()->with('status', 'Supplier created.');
    }

    public function show(Supplier $supplier, SupplierLedgerService $ledger): Response
    {
        return Inertia::render('Purchasing/Suppliers/Show', [
            'supplier' => $supplier->loadCount(['purchases', 'payments', 'returns']),
            'ledger' => $ledger->entries($supplier),
            'purchases' => $supplier->purchases()
                ->with(['warehouse:id,name'])
                ->latest('purchase_date')
                ->get(),
            'payments' => $supplier->payments()->latest('payment_date')->get(),
            'returns' => $supplier->returns()->latest('return_date')->get(),
        ]);
    }

    public function destroy(Supplier $supplier, Audit $audit): RedirectResponse
    {
        if ($supplier->purchases()->exists() || $supplier->payments()->exists() || $supplier->returns()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete supplier because they have transaction history.']);
        }

        $audit->record('supplier.deleted', $supplier, $supplier->toArray(), null);
        $supplier->delete();

        return redirect()->route('suppliers.index')->with('status', 'Supplier deleted.');
    }

    private function uniqueCode(string $name): string
    {
        $base = strtoupper(Str::slug($name, ''));
        $base = substr($base, 0, 8) ?: 'SUP';
        $code = $base;
        $suffix = 2;

        while (Supplier::query()->where('code', $code)->exists()) {
            $code = $base.$suffix;
            $suffix++;
        }

        return $code;
    }
}
