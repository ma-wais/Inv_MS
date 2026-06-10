<?php

namespace App\Services\Purchasing;

use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Support\Collection;

class SupplierLedgerService
{
    public function entries(Supplier $supplier): Collection
    {
        $entries = collect([
            [
                'date' => null,
                'type' => 'opening_balance',
                'number' => 'OPENING',
                'description' => 'Opening balance',
                'debit' => 0.0,
                'credit' => (float) $supplier->opening_balance,
            ],
        ]);

        $supplier->purchases()
            ->where('status', Purchase::STATUS_POSTED)
            ->get()
            ->each(fn ($purchase) => $entries->push([
                'date' => $purchase->purchase_date->toDateString(),
                'type' => 'purchase',
                'number' => $purchase->number,
                'description' => 'Purchase invoice',
                'debit' => 0.0,
                'credit' => (float) $purchase->grand_total,
            ]));

        $supplier->payments()->get()->each(fn ($payment) => $entries->push([
            'date' => $payment->payment_date->toDateString(),
            'type' => 'payment',
            'number' => $payment->number,
            'description' => 'Supplier payment',
            'debit' => (float) $payment->amount,
            'credit' => 0.0,
        ]));

        $supplier->returns()->where('status', 'posted')->get()->each(fn ($return) => $entries->push([
            'date' => $return->return_date->toDateString(),
            'type' => 'purchase_return',
            'number' => $return->number,
            'description' => 'Purchase return',
            'debit' => (float) $return->total,
            'credit' => 0.0,
        ]));

        $balance = 0.0;

        return $entries
            ->sortBy(fn (array $entry) => ($entry['date'] ?? '0000-00-00').'|'.$entry['number'])
            ->values()
            ->map(function (array $entry) use (&$balance): array {
                $balance += $entry['credit'] - $entry['debit'];
                $entry['balance'] = round($balance, 4);

                return $entry;
            });
    }
}
