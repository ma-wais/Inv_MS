<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('unit_cost', 18, 4)->nullable();
            $table->decimal('net_total', 18, 4)->nullable();
        });
        Schema::table('purchase_items', fn (Blueprint $table) => $table->decimal('net_total', 18, 4)->nullable());
        Schema::table('sale_return_items', fn (Blueprint $table) => $table->decimal('unit_cost', 18, 4)->nullable());

        // Recover recorded costs from immutable movements; never substitute today's catalog price.
        foreach (['sale_items' => ['sale_id', 'App\\Models\\Sale', 'sale'], 'sale_return_items' => ['sale_return_id', 'App\\Models\\SaleReturn', 'sale_return']] as $table => [$reference, $type, $movement]) {
            DB::table($table)->orderBy('id')->chunkById(200, function ($rows) use ($table, $reference, $type, $movement) {
                foreach ($rows as $row) {
                    $cost = DB::table('stock_movements')->where('tenant_id', $row->tenant_id)
                        ->where('reference_type', $type)->where('reference_id', $row->{$reference})
                        ->where('type', $movement)->where('product_variant_id', $row->product_variant_id)
                        ->where('product_batch_id', $row->product_batch_id)->whereNotNull('unit_cost')
                        ->selectRaw('SUM(ABS(quantity) * unit_cost) / NULLIF(SUM(ABS(quantity)), 0) as cost')->value('cost');
                    if ($cost !== null) {
                        DB::table($table)->where('id', $row->id)->update(['unit_cost' => round((float) $cost, 4)]);
                    }
                }
            });
        }
        foreach (['sales' => ['sale_items', 'sale_id'], 'purchases' => ['purchase_items', 'purchase_id']] as $table => [$itemsTable, $foreignKey]) {
            DB::table($table)->orderBy('id')->chunkById(200, function ($invoices) use ($itemsTable, $foreignKey) {
                foreach ($invoices as $invoice) {
                    $items = DB::table($itemsTable)->where($foreignKey, $invoice->id)->orderBy('id')->get();
                    $weight = (float) $items->sum('line_total');
                    $field = $weight > 0 ? 'line_total' : 'quantity';
                    $weight = $weight > 0 ? $weight : (float) $items->sum('quantity');
                    $allocatedTotal = 0.0;
                    $cumulativeWeight = 0.0;
                    foreach ($items as $index => $item) {
                        $cumulativeWeight += (float) $item->{$field};
                        $target = $index === $items->count() - 1 ? (float) $invoice->grand_total : round((float) $invoice->grand_total * $cumulativeWeight / $weight, 4);
                        $allocated = round($target - $allocatedTotal, 4);
                        DB::table($itemsTable)->where('id', $item->id)->update(['net_total' => $allocated]);
                        $allocatedTotal = $target;
                    }
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('sale_items', fn (Blueprint $table) => $table->dropColumn(['unit_cost', 'net_total']));
        Schema::table('purchase_items', fn (Blueprint $table) => $table->dropColumn('net_total'));
        Schema::table('sale_return_items', fn (Blueprint $table) => $table->dropColumn('unit_cost'));
    }
};
