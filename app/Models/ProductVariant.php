<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'product_id', 'name', 'sku', 'purchase_price', 'sale_price', 'wholesale_price',
        'minimum_sale_price', 'reorder_level', 'is_active', 'attributes',
    ];

    protected function casts(): array
    {
        return [
            'purchase_price' => 'decimal:4',
            'sale_price' => 'decimal:4',
            'wholesale_price' => 'decimal:4',
            'minimum_sale_price' => 'decimal:4',
            'reorder_level' => 'decimal:4',
            'is_active' => 'boolean',
            'attributes' => 'array',
        ];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function barcodes()
    {
        return $this->hasMany(ProductBarcode::class);
    }

    public function stockBalances()
    {
        return $this->hasMany(StockBalance::class);
    }
}
