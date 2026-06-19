<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'sale_id', 'product_variant_id', 'product_batch_id', 'quantity',
        'returned_quantity', 'unit_price', 'discount_total', 'tax_total', 'line_total',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:6',
            'returned_quantity' => 'decimal:6',
            'unit_price' => 'decimal:4',
            'discount_total' => 'decimal:4',
            'tax_total' => 'decimal:4',
            'line_total' => 'decimal:4',
        ];
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function batch()
    {
        return $this->belongsTo(ProductBatch::class, 'product_batch_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
