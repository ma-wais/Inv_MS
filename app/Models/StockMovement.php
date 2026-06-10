<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use BelongsToTenant, HasFactory;

    public const TYPE_OPENING = 'opening';

    public const TYPE_PURCHASE = 'purchase';

    public const TYPE_PURCHASE_RETURN = 'purchase_return';

    public const TYPE_SALE = 'sale';

    public const TYPE_SALE_RETURN = 'sale_return';

    public const TYPE_ADJUSTMENT = 'adjustment';

    public const TYPE_TRANSFER_IN = 'transfer_in';

    public const TYPE_TRANSFER_OUT = 'transfer_out';

    public const TYPE_DAMAGE = 'damage';

    public const TYPE_EXPIRY = 'expiry';

    protected $fillable = [
        'tenant_id', 'warehouse_id', 'product_variant_id', 'product_batch_id', 'user_id', 'type',
        'quantity', 'unit_cost', 'reference_type', 'reference_id', 'reference_number', 'note', 'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:6',
            'unit_cost' => 'decimal:4',
            'occurred_at' => 'datetime',
        ];
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function batch()
    {
        return $this->belongsTo(ProductBatch::class, 'product_batch_id');
    }
}
