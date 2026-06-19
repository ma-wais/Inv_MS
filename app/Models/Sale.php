<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'customer_id', 'branch_id', 'warehouse_id', 'created_by', 'number', 'invoice_number',
        'sale_date', 'status', 'subtotal', 'discount_total', 'tax_total', 'shipping_total',
        'grand_total', 'paid_total', 'posted_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'sale_date' => 'date',
            'subtotal' => 'decimal:4',
            'discount_total' => 'decimal:4',
            'tax_total' => 'decimal:4',
            'shipping_total' => 'decimal:4',
            'grand_total' => 'decimal:4',
            'paid_total' => 'decimal:4',
            'posted_at' => 'datetime',
        ];
    }

    protected $appends = ['outstanding'];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments()
    {
        return $this->hasMany(CustomerPayment::class);
    }

    public function returns()
    {
        return $this->hasMany(SaleReturn::class);
    }

    public function getOutstandingAttribute(): float
    {
        return round((float) $this->grand_total - (float) $this->paid_total, 4);
    }
}
