<?php

use App\Http\Controllers\Admin\AffiliateController;
use App\Http\Controllers\Admin\AgentController;
use App\Http\Controllers\Admin\AiUsageLogController;
use App\Http\Controllers\Admin\AppConfigAdminController;
use App\Http\Controllers\Admin\AppConfigController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BankAccountController;
use App\Http\Controllers\Admin\HomeController;
use App\Http\Controllers\Admin\IndexController;
use App\Http\Controllers\Admin\KnowledgeBaseController;
use App\Http\Controllers\Admin\MasterAffiliateController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\TourProductController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VendorCatalogController;
use App\Http\Controllers\Admin\VendorController;
use App\Http\Controllers\Admin\WalletController;
use App\Http\Controllers\Admin\WalletTransactionController;
use App\Http\Controllers\Admin\WithdrawalController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', [IndexController::class, 'show'])->name('show');
        Route::middleware(['guest', 'can:access-from-main-domain'])->group(function () {
            Route::get('login', [AuthController::class, 'showLogin'])->name('login.show');
            Route::post('login', [AuthController::class, 'login'])->name('login.store');
            Route::get('register', [AuthController::class, 'showRegister'])->name('register.show');
            Route::post('register', [AuthController::class, 'register'])->name('register.store');
        });

        Route::middleware(['auth', 'can:access-admin-pages'])->group(function () {
            //
            Route::resource('app-configs', AppConfigController::class)->names('app-configs');

            Route::get(
                'settings/app-config-admin',
                [AppConfigAdminController::class, 'index']
            )->name('app-config-admin.index');

            Route::put(
                'settings/app-config-admin',
                [AppConfigAdminController::class, 'update']
            )->name('app-config-admin.update');

            // 2. Dashboard
            Route::get('/dashboard', [HomeController::class, 'show'])->name('dashboard');

            // 3. Database — Vendors, Agents, Customers, Users
            Route::prefix('database')->name('database.')->group(function () {
                Route::resource('vendors', VendorController::class)->names('vendors');
                Route::resource('agents', AgentController::class)->names('agents');
                Route::get('affiliates', [AffiliateController::class, 'index'])->name('affiliates');
                Route::get('master-affiliates', [MasterAffiliateController::class, 'index'])->name('master-affiliates');

                Route::put('users/bulk-update', [UserController::class, 'bulkUpdate'])->name('users.bulk-update');
                Route::get('users/export-csv', [UserController::class, 'exportAsCsv'])->name('users.export-csv');
                Route::resource('users', UserController::class)->names('users');
                Route::resource('permissions', PermissionController::class)->names('permissions');
                Route::resource('roles', RoleController::class)->names('roles');
                Route::resource('knowledge-bases', KnowledgeBaseController::class)->names('knowledge-bases');
                Route::resource('medias', MediaController::class)->names('medias');
                Route::post('medias/{media}/trigger-generate-knowledge-base', [MediaController::class, 'triggerGenerateKnowledgeBase'])->name('medias.trigger-generate-knowledge-base');
                Route::resource('ai-usage-logs', AiUsageLogController::class)->names('ai-usage-logs');
            });
            Route::prefix('funds')->name('funds.')->group(function () {
                Route::resource('withdrawals', WithdrawalController::class);
                Route::resource('wallets', WalletController::class);
                Route::resource('wallet-transactions', WalletTransactionController::class);
                Route::resource('bank-accounts', BankAccountController::class);
                Route::resource('payments', PaymentController::class);
            });

            // 4. Tour
            Route::prefix('tours')->name('tours.')->group(function () {
                Route::get('products', [TourProductController::class, 'index'])->name('products');
                Route::get('products/{tour}/edit', [TourProductController::class, 'edit'])->name('products.edit');
                Route::put('products/{tour}', [TourProductController::class, 'update'])->name('products.update');
                Route::delete('products/{tour}', [TourProductController::class, 'destroy'])->name('products.destroy');
                Route::get('vendor-catalogs', [VendorCatalogController::class, 'index'])->name('vendor-catalogs');
                Route::get('orders', function () {
                    return inertia('admin/tours/orders/index');
                })->name('orders');
            });

            // 8. Reports
            Route::prefix('reports')->name('reports.')->group(function () {
                Route::get('inventories', function () {
                    return inertia('admin/reports/inventories/index');
                })->name('inventories');
            });

            // 9. Settings
            Route::prefix('settings')->name('settings.')->group(function () {
                Route::get('profile', [ProfileController::class, 'edit'])->name('profile');
                Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');
                Route::get('change-password', function () {
                    return inertia('admin/settings/change-password/index');
                })->name('change-password');
            });
        });

    });
