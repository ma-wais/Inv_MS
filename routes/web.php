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
use App\Http\Controllers\Sales\CustomerController;
use App\Http\Controllers\Sales\CustomerPaymentController;
use App\Http\Controllers\Sales\SaleController;
use App\Http\Controllers\Sales\SaleReturnController;
use App\Http\Controllers\Accounting\AccountController;
use App\Http\Controllers\Accounting\JournalController;
use App\Http\Controllers\Accounting\ExpenseController;
use App\Http\Controllers\Accounting\AccountingReportController;
use App\Http\Controllers\Reporting\OperationalReportController;
use App\Http\Controllers\SuperAdmin\SuperAdminController;
use App\Http\Controllers\ShopMediaController;
use App\Http\Controllers\ShopSettingsController;
use App\Http\Controllers\TenantSelectionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');

    Route::get('/register', [\App\Http\Controllers\Auth\RegisterController::class, 'create'])->name('register');
    Route::post('/register', [\App\Http\Controllers\Auth\RegisterController::class, 'store'])->name('register.store');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('/shops/select', [TenantSelectionController::class, 'index'])->name('tenants.select');
    Route::post('/shops/{tenant}/select', [TenantSelectionController::class, 'update'])->name('tenants.update');

    Route::middleware('super-admin')->group(function () {
        Route::get('/super-admin/tenants', [SuperAdminController::class, 'index'])->name('super-admin.tenants.index');
        Route::post('/super-admin/tenants', [SuperAdminController::class, 'storeTenant'])->name('super-admin.tenants.store');
        Route::put('/super-admin/tenants/{tenant}', [SuperAdminController::class, 'updateTenant'])->name('super-admin.tenants.update');
        Route::post('/super-admin/tenants/{tenant}/toggle-status', [SuperAdminController::class, 'toggleStatus'])->name('super-admin.tenants.toggle-status');

        Route::get('/super-admin/users', [SuperAdminController::class, 'usersIndex'])->name('super-admin.users.index');
        Route::post('/super-admin/users', [SuperAdminController::class, 'usersStore'])->name('super-admin.users.store');
        Route::put('/super-admin/users/{user}', [SuperAdminController::class, 'usersUpdate'])->name('super-admin.users.update');
        Route::delete('/super-admin/users/{user}', [SuperAdminController::class, 'usersDestroy'])->name('super-admin.users.destroy');
        
        Route::post('/super-admin/users/{user}/tenants', [SuperAdminController::class, 'linkTenant'])->name('super-admin.users.link-tenant');
        Route::delete('/super-admin/users/{user}/tenants/{tenant}', [SuperAdminController::class, 'unlinkTenant'])->name('super-admin.users.unlink-tenant');

        Route::get('/super-admin/backups', [\App\Http\Controllers\SuperAdmin\BackupController::class, 'index'])->name('super-admin.backups.index');
        Route::post('/super-admin/backups', [\App\Http\Controllers\SuperAdmin\BackupController::class, 'store'])->name('super-admin.backups.store');
        Route::get('/super-admin/backups/{filename}', [\App\Http\Controllers\SuperAdmin\BackupController::class, 'download'])->name('super-admin.backups.download');
        Route::delete('/super-admin/backups/{filename}', [\App\Http\Controllers\SuperAdmin\BackupController::class, 'destroy'])->name('super-admin.backups.destroy');

        Route::get('/super-admin/activity-logs', [\App\Http\Controllers\SuperAdmin\ActivityLogController::class, 'index'])->name('super-admin.activity-logs.index');
    });

    Route::middleware('tenant')->group(function () {
        Route::get('/dashboard', DashboardController::class)
            ->middleware('permission:dashboard.view')
            ->name('dashboard');

        Route::get('/profile', [\App\Http\Controllers\Settings\ProfileController::class, 'edit'])->name('profile.edit');
        Route::put('/profile', [\App\Http\Controllers\Settings\ProfileController::class, 'update'])->name('profile.update');

        Route::get('/settings/shop', [ShopSettingsController::class, 'edit'])
            ->middleware('permission:shops.manage')
            ->name('settings.shop.edit');
        Route::put('/settings/shop', [ShopSettingsController::class, 'update'])
            ->middleware('permission:shops.manage')
            ->name('settings.shop.update');
        Route::get('/settings/backup', [ShopSettingsController::class, 'backup'])
            ->middleware('permission:shops.manage')
            ->name('settings.shop.backup');

        Route::middleware('permission:shops.manage')->group(function () {
            Route::get('/settings/staff', [\App\Http\Controllers\Settings\StaffController::class, 'index'])->name('settings.staff.index');
            Route::post('/settings/staff', [\App\Http\Controllers\Settings\StaffController::class, 'store'])->name('settings.staff.store');
            Route::put('/settings/staff/{user}', [\App\Http\Controllers\Settings\StaffController::class, 'update'])->name('settings.staff.update');
            Route::delete('/settings/staff/{user}', [\App\Http\Controllers\Settings\StaffController::class, 'destroy'])->name('settings.staff.destroy');
        });

        Route::get('/settings/media', [ShopMediaController::class, 'index'])
            ->middleware('permission:shops.manage')
            ->name('settings.media.index');
        Route::post('/settings/media', [ShopMediaController::class, 'store'])
            ->middleware('permission:shops.manage')
            ->name('settings.media.store');
        Route::delete('/settings/media/{media}', [ShopMediaController::class, 'destroy'])
            ->middleware('permission:shops.manage')
            ->name('settings.media.destroy');

        Route::middleware('permission:products.manage')->group(function () {
            Route::get('/inventory/setup', [CatalogSetupController::class, 'index'])->name('inventory.setup');
            Route::post('/inventory/categories', [CatalogSetupController::class, 'storeCategory'])->name('categories.store');
            Route::put('/inventory/categories/{category}', [CatalogSetupController::class, 'updateCategory'])->name('categories.update');
            Route::delete('/inventory/categories/{category}', [CatalogSetupController::class, 'destroyCategory'])->name('categories.destroy');

            Route::post('/inventory/brands', [CatalogSetupController::class, 'storeBrand'])->name('brands.store');
            Route::put('/inventory/brands/{brand}', [CatalogSetupController::class, 'updateBrand'])->name('brands.update');
            Route::delete('/inventory/brands/{brand}', [CatalogSetupController::class, 'destroyBrand'])->name('brands.destroy');

            Route::post('/inventory/units', [CatalogSetupController::class, 'storeUnit'])->name('units.store');
            Route::put('/inventory/units/{unit}', [CatalogSetupController::class, 'updateUnit'])->name('units.update');
            Route::delete('/inventory/units/{unit}', [CatalogSetupController::class, 'destroyUnit'])->name('units.destroy');

            Route::get('/products', [ProductController::class, 'index'])->name('products.index');
            Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
            Route::post('/products', [ProductController::class, 'store'])->name('products.store');
            Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');
            Route::post('/products/{product}/variants', [ProductController::class, 'storeVariant'])->name('products.variants.store');
            Route::delete('/products/{product}/variants/{variant}', [ProductController::class, 'destroyVariant'])->name('products.variants.destroy');
            Route::put('/products/{product}/variants/{variant}', [ProductController::class, 'updateVariant'])->name('products.variants.update');
            Route::post('/products/{product}/unit-conversions', [ProductController::class, 'storeUnitConversion'])->name('products.unit-conversions.store');
            Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');
            Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
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
            Route::get('/purchases/returns', [PurchaseReturnController::class, 'index'])->name('purchase-returns.index');
            Route::get('/purchases/returns/{return}', [PurchaseReturnController::class, 'show'])->name('purchase-returns.show');
            Route::get('/purchases/{purchase}', [PurchaseController::class, 'show'])->name('purchases.show');
            Route::post('/purchases/{purchase}/receive', [PurchaseController::class, 'receive'])->name('purchases.receive');

            Route::get('/purchases/{purchase}/returns/create', [PurchaseReturnController::class, 'create'])->name('purchase-returns.create');
            Route::post('/purchases/{purchase}/returns', [PurchaseReturnController::class, 'store'])->name('purchase-returns.store');
        });

        Route::middleware('permission:sales.manage')->group(function () {
            Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
            Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
            Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
            Route::post('/customers/{customer}/payments', [CustomerPaymentController::class, 'store'])->name('customer-payments.store');

            Route::get('/sales', [SaleController::class, 'index'])->name('sales.index');
            Route::get('/pos', [SaleController::class, 'create'])->name('sales.create');
            Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');
            Route::get('/sales/returns', [SaleReturnController::class, 'index'])->name('sale-returns.index');
            Route::get('/sales/returns/{return}', [SaleReturnController::class, 'show'])->name('sale-returns.show');
            Route::get('/sales/{sale}', [SaleController::class, 'show'])->name('sales.show');

            Route::get('/sales/{sale}/returns/create', [SaleReturnController::class, 'create'])->name('sale-returns.create');
            Route::post('/sales/{sale}/returns', [SaleReturnController::class, 'store'])->name('sale-returns.store');
        });

        Route::middleware('permission:accounting.manage')->group(function () {
            Route::get('/accounts/create', [AccountController::class, 'create'])->name('accounts.create');
            Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index');
            Route::post('/accounts', [AccountController::class, 'store'])->name('accounts.store');

            Route::get('/journals', [JournalController::class, 'index'])->name('journals.index');
            Route::get('/journals/create', [JournalController::class, 'create'])->name('journals.create');
            Route::post('/journals', [JournalController::class, 'store'])->name('journals.store');

            Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
            Route::post('/expenses', [ExpenseController::class, 'store'])->name('expenses.store');

            Route::get('/reports/trial-balance', [AccountingReportController::class, 'trialBalance'])->name('reports.trial-balance');
            Route::get('/reports/profit-loss', [AccountingReportController::class, 'profitAndLoss'])->name('reports.profit-loss');
            Route::get('/reports/general-ledger', [AccountingReportController::class, 'generalLedger'])->name('reports.general-ledger');
        });

        Route::middleware('permission:reports.view')->group(function () {
            Route::get('/reports/inventory-valuation', [OperationalReportController::class, 'inventoryValuation'])->name('reports.inventory-valuation');
            Route::get('/reports/product-profit', [OperationalReportController::class, 'productProfit'])->name('reports.product-profit');
            Route::get('/reports/expiry', [OperationalReportController::class, 'expiry'])->name('reports.expiry');
            Route::get('/reports/receivables-payables', [OperationalReportController::class, 'receivablesPayables'])->name('reports.receivables-payables');
        });
    });
});
