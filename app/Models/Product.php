<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'category_id', 'brand_id', 'base_unit_id', 'name', 'slug', 'product_type',
        'description', 'track_batches', 'track_expiry', 'is_active', 'attributes', 'image_path',
    ];

    protected function casts(): array
    {
        return [
            'track_batches' => 'boolean',
            'track_expiry' => 'boolean',
            'is_active' => 'boolean',
            'attributes' => 'array',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function baseUnit()
    {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function unitConversions()
    {
        return $this->hasMany(ProductUnitConversion::class);
    }

    public function stockBalances()
    {
        return $this->hasManyThrough(
            StockBalance::class,
            ProductVariant::class,
            'product_id',
            'product_variant_id',
        );
    }
}
