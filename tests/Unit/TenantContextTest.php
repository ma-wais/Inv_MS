<?php

namespace Tests\Unit;

use App\Models\Tenant;
use App\Support\Tenancy\TenantContext;
use PHPUnit\Framework\TestCase;

class TenantContextTest extends TestCase
{
    public function test_it_stores_and_clears_the_current_tenant(): void
    {
        $tenant = new Tenant(['name' => 'Test Shop']);
        $tenant->id = 42;

        $context = new TenantContext;
        $context->set($tenant);

        $this->assertTrue($context->has());
        $this->assertSame(42, $context->id());
        $this->assertSame($tenant, $context->get());

        $context->clear();

        $this->assertFalse($context->has());
        $this->assertNull($context->id());
    }
}
