<?php

namespace Tests\Unit;

use App\Models\ProductVariant;
use App\Models\Tenant;
use App\Models\Warehouse;
use App\Services\Inventory\StockMovementService;
use App\Support\Tenancy\TenantContext;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class StockMovementServiceTest extends TestCase
{
    public function test_it_requires_a_selected_tenant(): void
    {
        $service = new StockMovementService(new TenantContext);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('A tenant must be selected');

        $service->record(new Warehouse, new ProductVariant, 'opening', 1);
    }

    public function test_it_rejects_zero_quantity(): void
    {
        $context = new TenantContext;
        $tenant = new Tenant;
        $tenant->id = 1;
        $context->set($tenant);

        $service = new StockMovementService($context);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('cannot be zero');

        $service->record(new Warehouse, new ProductVariant, 'opening', 0);
    }
}
