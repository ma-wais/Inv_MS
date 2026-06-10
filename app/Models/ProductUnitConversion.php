<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductUnitConversion extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = ['tenant_id', 'product_id', 'unit_id', 'base_quantity', 'barcode'];

    protected function casts(): array
    {
        return ['base_quantity' => 'decimal:6'];
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}
