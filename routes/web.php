<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Inventory\CatalogSetupController;
use App\Http\Controllers\Inventory\ProductController;
use App\Http\Controllers\Inventory\StockController;
use App\Http\Controllers\Purchasing\PurchaseController;
use App\Http\Controllers\Purchasing\PurchaseReturnController;
use App\Http\Controllers\Purchasing\SupplierController;
use App\Http\Controllers\Purchasing\SupplierPaymentController;
use App\Http\Controllers\ShopSettingsController;
use App\Http\Controllers\TenantSelectionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'appName' => config('app.name'),
    ]);
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('/shops/select', [TenantSelectionController::class, 'index'])->name('tenants.select');
    Route::post('/shops/{tenant}/select', [TenantSelectionController::class, 'update'])->name('tenants.update');

    Route::middleware('tenant')->group(function () {
        Route::get('/dashboard', DashboardController::class)
            ->middleware('permission:dashboard.view')
            ->name('dashboard');

        Route::get('/settings/shop', [ShopSettingsController::class, 'edit'])
            ->middleware('permission:shops.manage')
            ->name('settings.shop.edit');
        Route::put('/settings/shop', [ShopSettingsController::class, 'update'])
            ->middleware('permission:shops.manage')
            ->name('settings.shop.update');

        Route::middleware('permission:products.manage')->group(function () {
            Route::get('/inventory/setup', [CatalogSetupController::class, 'index'])->name('inventory.setup');
            Route::post('/inventory/categories', [CatalogSetupController::class, 'storeCategory'])->name('categories.store');
            Route::post('/inventory/brands', [CatalogSetupController::class, 'storeBrand'])->name('brands.store');
            Route::post('/inventory/units', [CatalogSetupController::class, 'storeUnit'])->name('units.store');

            Route::get('/products', [ProductController::class, 'index'])->name('products.index');
            Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
            Route::post('/products', [ProductController::class, 'store'])->name('products.store');
            Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');
            Route::post('/products/{product}/variants', [ProductController::class, 'storeVariant'])->name('products.variants.store');
            Route::post('/products/{product}/unit-conversions', [ProductController::class, 'storeUnitConversion'])->name('products.unit-conversions.store');
        });

        Route::middleware('permission:stock.manage')->group(function () {
            Route::get('/stock', [StockController::class, 'index'])->name('stock.index');
            Route::post('/stock/adjustments', [StockController::class, 'adjust'])->name('stock.adjustments.store');
        });

        Route::middleware('permission:purchases.manage')->group(function () {
            Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
            Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
            Route::get('/suppliers/{supplier}', [SupplierController::class, 'show'])->name('suppliers.show');
            Route::post('/suppliers/{supplier}/payments', [SupplierPaymentController::class, 'store'])->name('supplier-payments.store');

            Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
            Route::get('/purchases/create', [PurchaseController::class, 'create'])->name('purchases.create');
            Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');
            Route::get('/purchases/{purchase}', [PurchaseController::class, 'show'])->name('purchases.show');
            Route::post('/purchases/{purchase}/receive', [PurchaseController::class, 'receive'])->name('purchases.receive');

            Route::get('/purchases/{purchase}/returns/create', [PurchaseReturnController::class, 'create'])->name('purchase-returns.create');
            Route::post('/purchases/{purchase}/returns', [PurchaseReturnController::class, 'store'])->name('purchase-returns.store');
        });
    });
});
