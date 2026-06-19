<?php

namespace App\Services\Sales;

use App\Models\Customer;
use Illuminate\Support\Collection;

class CustomerLedgerService
{
    public function entries(Customer $customer): Collection
    {
        $entries = collect([
            [
                'date' => null,
                'type' => 'opening_balance',
                'number' => 'OPENING',
                'description' => 'Opening balance',
                'debit' => (float) $customer->opening_balance,
                'credit' => 0.0,
            ],
        ]);

        $customer->sales()
            ->where('status', 'posted')
            ->get()
            ->each(fn ($sale) => $entries->push([
                'date' => $sale->sale_date->toDateString(),
                'type' => 'sale',
                'number' => $sale->number,
                'description' => 'Sales invoice',
                'debit' => (float) $sale->grand_total,
                'credit' => 0.0,
            ]));

        $customer->payments()->get()->each(fn ($payment) => $entries->push([
            'date' => $payment->payment_date->toDateString(),
            'type' => 'payment',
            'number' => $payment->number,
            'description' => 'Customer payment',
            'debit' => 0.0,
            'credit' => (float) $payment->amount,
        ]));

        $customer->returns()->where('status', 'posted')->get()->each(fn ($return) => $entries->push([
            'date' => $return->return_date->toDateString(),
            'type' => 'sale_return',
            'number' => $return->number,
            'description' => 'Sales return',
            'debit' => 0.0,
            'credit' => (float) $return->total,
        ]));

        $balance = 0.0;

        return $entries
            ->sortBy(fn (array $entry) => ($entry['date'] ?? '0000-00-00').'|'.$entry['number'])
            ->values()
            ->map(function (array $entry) use (&$balance): array {
                $balance += $entry['debit'] - $entry['credit'];
                $entry['balance'] = round($balance, 4);

                return $entry;
            });
    }
}
