<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'purchase_id', 'product_variant_id', 'product_batch_id', 'quantity',
        'received_quantity', 'returned_quantity', 'unit_cost', 'discount_total', 'tax_total',
        'line_total', 'batch_number', 'expires_at', 'net_total',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:6',
            'received_quantity' => 'decimal:6',
            'returned_quantity' => 'decimal:6',
            'unit_cost' => 'decimal:4',
            'net_total' => 'decimal:4',
            'discount_total' => 'decimal:4',
            'tax_total' => 'decimal:4',
            'line_total' => 'decimal:4',
            'expires_at' => 'date',
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

    public function returnItems()
    {
        return $this->hasMany(PurchaseReturnItem::class);
    }
}
