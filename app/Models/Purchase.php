<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use BelongsToTenant, HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_ORDERED = 'ordered';

    public const STATUS_RECEIVED = 'received';

    public const STATUS_POSTED = 'posted';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'tenant_id', 'supplier_id', 'warehouse_id', 'created_by', 'number', 'supplier_invoice_number',
        'purchase_date', 'due_date', 'status', 'subtotal', 'discount_total', 'tax_total', 'shipping_total',
        'grand_total', 'paid_total', 'ordered_at', 'received_at', 'posted_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:4',
            'discount_total' => 'decimal:4',
            'tax_total' => 'decimal:4',
            'shipping_total' => 'decimal:4',
            'grand_total' => 'decimal:4',
            'paid_total' => 'decimal:4',
            'ordered_at' => 'datetime',
            'received_at' => 'datetime',
            'posted_at' => 'datetime',
        ];
    }

    protected $appends = ['outstanding', 'credit_balance', 'returned_total'];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function payments()
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function returns()
    {
        return $this->hasMany(PurchaseReturn::class);
    }

    public function getOutstandingAttribute(): float
    {
        return round(max(0, (float) $this->grand_total - (float) $this->paid_total - $this->getReturnedTotalAttribute()), 4);
    }

    public function getReturnedTotalAttribute(): float
    {
        if (array_key_exists('returns_total', $this->attributes)) {
            return (float) $this->attributes['returns_total'];
        }
        if ($this->relationLoaded('returns')) {
            return (float) $this->returns->where('status', 'posted')->sum('total');
        }

        return (float) $this->returns()->where('status', 'posted')->sum('total');
    }

    public function getCreditBalanceAttribute(): float
    {
        return round(max(0, (float) $this->paid_total + $this->getReturnedTotalAttribute() - (float) $this->grand_total), 4);
    }

    public function scopeWithReturnTotals($query)
    {
        return $query->withSum(['returns as returns_total' => fn ($query) => $query->where('status', 'posted')], 'total');
    }
}
