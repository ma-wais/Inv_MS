<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Services\Sales\SaleService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Sales/Index', [
            'sales' => Sale::query()
                ->with(['customer:id,name', 'warehouse:id,name'])
                ->latest('sale_date')
                ->paginate(20),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Sales/POS/Create', [
            'customers' => Customer::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'phone']),
            'warehouses' => Warehouse::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'accounts' => Account::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'name']),
            'variants' => ProductVariant::query()
                ->with([
                    'product:id,name,base_unit_id,product_type', 
                    'product.baseUnit:id,symbol',
                    'stockBalances:id,product_variant_id,warehouse_id,quantity',
                    'barcodes:id,product_variant_id,barcode'
                ])
                ->where('is_active', true)
                ->orderBy('sku')
                ->get(),
        ]);
    }

    public function store(Request $request, SaleService $saleService, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'integer'],
            'warehouse_id' => ['required', 'integer'],
            'invoice_number' => ['nullable', 'string', 'max:100'],
            'sale_date' => ['required', 'date'],
            'status' => ['required', 'in:draft,posted'],
            'discount_total' => ['nullable', 'numeric', 'min:0'],
            'tax_total' => ['nullable', 'numeric', 'min:0'],
            'shipping_total' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'integer'],
            'items.*.product_batch_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'gte:0'],
            
            // Payment details
            'payment_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'required_with:payment_amount', 'string', 'max:50'],
            'payment_account_id' => ['nullable', 'integer'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
        ]);

        $sale = $saleService->create($validated, $validated['items']);

        // Record payment if provided
        if (isset($validated['payment_amount']) && $validated['payment_amount'] > 0) {
            $payment = $saleService->recordPayment($sale->customer, [
                'sale_id' => $sale->id,
                'account_id' => $validated['payment_account_id'] ?? null,
                'payment_date' => $validated['sale_date'],
                'amount' => $validated['payment_amount'],
                'method' => $validated['payment_method'],
                'reference' => $validated['payment_reference'] ?? null,
                'notes' => 'POS checkout payment.',
            ]);
            $audit->record('customer.payment.created', $payment, null, $payment->toArray());
        }

        $audit->record('sale.created', $sale, null, $sale->toArray());

        return redirect()->route('sales.show', $sale)->with('status', 'Sale saved.');
    }

    public function show(Sale $sale): Response
    {
        return Inertia::render('Sales/Show', [
            'sale' => $sale->load(['customer', 'warehouse', 'items.variant.product.baseUnit', 'items.batch']),
            'accounts' => Account::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }
}
