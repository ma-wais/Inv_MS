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
    public function index(): Response
    {
        return Inertia::render('Purchasing/Suppliers/Index', [
            'suppliers' => Supplier::query()
                ->withCount(['purchases', 'payments', 'returns'])
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
