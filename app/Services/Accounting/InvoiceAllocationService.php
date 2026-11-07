<?php

namespace App\Services\Accounting;

use Illuminate\Support\Collection;

class InvoiceAllocationService
{
    public function allocate(Collection $items, float $total): Collection
    {
        $weight = (float) $items->sum('line_total');
        $field = $weight > 0 ? 'line_total' : 'quantity';
        $weight = $weight > 0 ? $weight : (float) $items->sum('quantity');
        $allocatedTotal = 0.0;
        $cumulativeWeight = 0.0;
        $last = $items->count() - 1;

        return $items->values()->map(function (array $item, int $index) use ($total, $weight, $field, $last, &$allocatedTotal, &$cumulativeWeight) {
            $cumulativeWeight += (float) $item[$field];
            $target = $index === $last ? round($total, 4) : round($total * $cumulativeWeight / $weight, 4);
            $allocated = round($target - $allocatedTotal, 4);
            $allocatedTotal = $target;

            return [...$item, 'net_total' => $allocated];
        });
    }

    public function returnCredit(float $netTotal, float $quantity, float $alreadyReturned, float $returnQuantity, float $alreadyCredited): float
    {
        $target = round($netTotal * min($quantity, $alreadyReturned + $returnQuantity) / $quantity, 4);

        return round(max(0, min($target - $alreadyCredited, $netTotal - $alreadyCredited)), 4);
    }
}
