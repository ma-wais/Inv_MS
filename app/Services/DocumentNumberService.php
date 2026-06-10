<?php

namespace App\Services;

use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class DocumentNumberService
{
    public function __construct(private readonly TenantContext $tenantContext) {}

    public function next(string $model, string $prefix): string
    {
        if (! is_subclass_of($model, Model::class)) {
            throw new InvalidArgumentException('Document model must be an Eloquent model.');
        }

        $tenantId = $this->tenantContext->id();

        if ($tenantId === null) {
            throw new InvalidArgumentException('A tenant must be selected before generating document numbers.');
        }

        $datePrefix = $prefix.'-'.now()->format('Ym').'-';
        $latest = $model::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('number', 'like', $datePrefix.'%')
            ->orderByDesc('number')
            ->value('number');

        $sequence = $latest ? ((int) substr($latest, -5)) + 1 : 1;

        return $datePrefix.str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
    }
}
