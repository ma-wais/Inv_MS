<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleReturn extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'customer_id', 'sale_id', 'warehouse_id', 'created_by', 'number',
        'return_date', 'status', 'total', 'notes', 'posted_at',
    ];

    protected function casts(): array
    {
        return [
            'return_date' => 'date',
            'total' => 'decimal:4',
            'posted_at' => 'datetime',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(SaleReturnItem::class);
    }
}
