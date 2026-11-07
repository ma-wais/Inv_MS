<?php

namespace Tests\Unit;

use App\Services\Accounting\InvoiceAllocationService;
use PHPUnit\Framework\TestCase;

class InvoiceAllocationTest extends TestCase
{
    public function test_tiny_invoice_allocations_are_non_negative_and_sum_to_the_invoice_total(): void
    {
        $items = collect(array_fill(0, 4, ['line_total' => 1, 'quantity' => 1]));
        $allocated = (new InvoiceAllocationService)->allocate($items, 0.0002);
        $this->assertEqualsWithDelta(0.0002, $allocated->sum('net_total'), 0.0000001);
        foreach ($allocated as $item) {
            $this->assertGreaterThanOrEqual(0, $item['net_total']);
        }
    }

    public function test_invoice_adjustments_follow_item_value_and_zero_priced_lines_use_quantity(): void
    {
        $service = new InvoiceAllocationService;
        $this->assertSame([30.0, 70.0], $service->allocate(collect([
            ['line_total' => 60, 'quantity' => 1], ['line_total' => 140, 'quantity' => 1],
        ]), 100)->pluck('net_total')->all());
        $this->assertSame([10.0, 20.0], $service->allocate(collect([
            ['line_total' => 0, 'quantity' => 1], ['line_total' => 0, 'quantity' => 2],
        ]), 30)->pluck('net_total')->all());
    }
}
