<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseReturn extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'supplier_id', 'purchase_id', 'warehouse_id', 'created_by',
        'number', 'return_date', 'status', 'total', 'notes', 'posted_at',
    ];

    protected function casts(): array
    {
        return [
            'return_date' => 'date',
            'total' => 'decimal:4',
            'posted_at' => 'datetime',
        ];
    }

    public function items()
    {
        return $this->hasMany(PurchaseReturnItem::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
