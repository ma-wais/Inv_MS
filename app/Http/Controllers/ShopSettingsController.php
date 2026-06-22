<?php

namespace App\Http\Controllers;

use App\Support\Auditing\Audit;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ShopSettingsController extends Controller
{
    public function edit(TenantContext $tenantContext): Response
    {
        $tenant = $tenantContext->get();
        return Inertia::render('Settings/Shop', [
            'shop' => array_merge(
                $tenant->only([
                    'name',
                    'legal_name',
                    'email',
                    'phone',
                    'currency',
                    'timezone',
                ]),
                [
                    'enabled_reports' => $tenant->meta['enabled_reports'] ?? ['valuation', 'profit', 'expiry', 'receivables_payables']
                ]
            ),
        ]);
    }

    public function update(Request $request, TenantContext $tenantContext, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'currency' => ['required', 'string', 'size:3'],
            'timezone' => ['required', 'timezone'],
            'enabled_reports' => ['nullable', 'array'],
        ]);

        $tenant = $tenantContext->get();
        $oldValues = $tenant->only(['name', 'legal_name', 'email', 'phone', 'currency', 'timezone']);
        
        $tenant->update([
            'name' => $validated['name'],
            'legal_name' => $validated['legal_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'currency' => $validated['currency'],
            'timezone' => $validated['timezone'],
            'meta' => array_merge($tenant->meta ?? [], [
                'enabled_reports' => $validated['enabled_reports'] ?? ['valuation', 'profit', 'expiry', 'receivables_payables']
            ]),
        ]);

        $audit->record('shop.settings.updated', $tenant, $oldValues, $tenant->only(['name', 'legal_name', 'email', 'phone', 'currency', 'timezone']));

        return back()->with('status', 'Shop settings updated.');
    }

    public function backup(Request $request, TenantContext $tenantContext, Audit $audit)
    {
        $tenant = $tenantContext->get();
        $tenantId = $tenant->id;

        $tables = [
            'branches', 'warehouses', 'units', 'categories', 'brands',
            'products', 'product_variants', 'product_barcodes', 'product_batches',
            'product_unit_conversions', 'stock_balances', 'stock_movements',
            'purchases', 'purchase_items', 'purchase_returns', 'purchase_return_items',
            'sales', 'sale_items', 'sale_returns', 'sale_return_items',
            'accounts', 'journal_entries', 'journal_lines', 'expenses',
            'customers', 'customer_payments', 'suppliers', 'supplier_payments'
        ];

        $zipFile = tempnam(sys_get_temp_dir(), 'tenant_backup_') . '.zip';
        $zip = new \ZipArchive();

        if ($zip->open($zipFile, \ZipArchive::CREATE) !== true) {
            return back()->withErrors(['error' => 'Could not create backup zip file.']);
        }

        foreach ($tables as $table) {
            $rows = DB::table($table);
            if (\Illuminate\Support\Facades\Schema::hasColumn($table, 'tenant_id')) {
                $rows->where('tenant_id', $tenantId);
            }
            $data = $rows->get();

            if ($data->isEmpty()) {
                continue;
            }

            $output = fopen('php://temp', 'r+');
            
            $headers = array_keys((array)$data->first());
            fputcsv($output, $headers);

            foreach ($data as $row) {
                fputcsv($output, (array)$row);
            }

            rewind($output);
            $csvContent = stream_get_contents($output);
            fclose($output);

            $zip->addFromString("{$table}.csv", $csvContent);
        }

        $zip->close();

        $audit->record('shop.data.backed_up', $tenant, null, ['tables_count' => count($tables)]);

        $filename = 'backup_' . Str::slug($tenant->name) . '_' . date('Ymd_His') . '.zip';

        return response()->download($zipFile, $filename)->deleteFileAfterSend(true);
    }
}

