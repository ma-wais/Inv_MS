<?php

namespace App\Support;

final class ShopRole
{
    public const ADMIN = 'admin';

    public const WORKER = 'worker';

    public const PERMISSIONS = [
        'dashboard.view', 'shops.manage', 'products.manage', 'stock.manage',
        'purchases.manage', 'sales.manage', 'accounting.manage', 'reports.view',
    ];

    public const WORKER_PERMISSIONS = [
        'dashboard.view', 'products.manage', 'stock.manage',
        'purchases.manage', 'sales.manage', 'reports.view',
    ];

    public static function normalize(?string $role): ?string
    {
        return match ($role) {
            'owner', self::ADMIN => self::ADMIN,
            'manager', 'cashier', 'accountant', 'viewer', self::WORKER => self::WORKER,
            default => null,
        };
    }
}
