<?php

namespace App\Services\Inventory;

use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class StockMovementService
{
    private const TYPES = [
        StockMovement::TYPE_OPENING,
        StockMovement::TYPE_PURCHASE,
        StockMovement::TYPE_PURCHASE_RETURN,
        StockMovement::TYPE_SALE,
        StockMovement::TYPE_SALE_RETURN,
        StockMovement::TYPE_ADJUSTMENT,
        StockMovement::TYPE_TRANSFER_IN,
        StockMovement::TYPE_TRANSFER_OUT,
        StockMovement::TYPE_DAMAGE,
        StockMovement::TYPE_EXPIRY,
    ];

    public function __construct(private readonly TenantContext $tenantContext) {}

    public function record(
        Warehouse $warehouse,
        ProductVariant $variant,
        string $type,
        string|float|int $quantity,
        ?ProductBatch $batch = null,
        string|float|int|null $unitCost = null,
        ?Model $reference = null,
        ?string $referenceNumber = null,
        ?string $note = null,
    ): StockMovement {
        $tenantId = $this->tenantContext->id();
        $quantity = (float) $quantity;

        if ($tenantId === null) {
            throw new InvalidArgumentException('A tenant must be selected before recording stock.');
        }

        if ($quantity === 0.0) {
            throw new InvalidArgumentException('Stock movement quantity cannot be zero.');
        }

        if (! in_array($type, self::TYPES, true)) {
            throw new InvalidArgumentException('Unknown stock movement type.');
        }

        if ($warehouse->tenant_id !== $tenantId || $variant->tenant_id !== $tenantId) {
            throw new InvalidArgumentException('Stock movement records must belong to the current tenant.');
        }

        if ($batch && ($batch->tenant_id !== $tenantId || $batch->product_variant_id !== $variant->id)) {
            throw new InvalidArgumentException('The selected batch does not belong to this product variant.');
        }

        return DB::transaction(function () use (
            $tenantId,
            $warehouse,
            $variant,
            $batch,
            $type,
            $quantity,
            $unitCost,
            $reference,
            $referenceNumber,
            $note,
        ): StockMovement {
            $batchKey = $batch ? (string) $batch->id : '';

            $balance = StockBalance::query()
                ->withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->where('warehouse_id', $warehouse->id)
                ->where('product_variant_id', $variant->id)
                ->where('batch_key', $batchKey)
                ->lockForUpdate()
                ->first();

            if ($balance === null) {
                $balance = StockBalance::query()->withoutGlobalScopes()->create([
                    'tenant_id' => $tenantId,
                    'warehouse_id' => $warehouse->id,
                    'product_variant_id' => $variant->id,
                    'product_batch_id' => $batch?->id,
                    'batch_key' => $batchKey,
                    'quantity' => 0,
                ]);
            }

            if (((float) $balance->quantity + $quantity) < 0) {
                throw new InvalidArgumentException('This movement would make stock negative.');
            }

            $balance->increment('quantity', $quantity);

            return StockMovement::query()->withoutGlobalScopes()->create([
                'tenant_id' => $tenantId,
                'warehouse_id' => $warehouse->id,
                'product_variant_id' => $variant->id,
                'product_batch_id' => $batch?->id,
                'user_id' => auth()->id(),
                'type' => $type,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'reference_type' => $reference?->getMorphClass(),
                'reference_id' => $reference?->getKey(),
                'reference_number' => $referenceNumber,
                'note' => $note,
                'occurred_at' => now(),
            ]);
        });
    }
}
