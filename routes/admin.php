<?php

use App\Http\Controllers\Admin\AgentController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\HomeController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\TourProductController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VendorCatalogController;
use App\Http\Controllers\Admin\VendorController;
use App\Http\Middleware\EnsureHasAdminAccess;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware(['auth', EnsureHasAdminAccess::class])->name('admin.')->group(function () {

  // 2. Dashboard
  Route::get('/dashboard', [HomeController::class, 'show'])->name('dashboard');

  // 3. Database — Vendors, Agents, Customers, Users
  Route::prefix('database')->name('database.')->group(function () {
    Route::resource('vendors', VendorController::class)->names('vendors');
    Route::resource('agents', AgentController::class)->names('agents');
    Route::get('customers', [CustomerController::class, 'index'])->name('customers');
    Route::get('affiliates', function () {
      return inertia('admin/database/affiliates/index');
    })->name('affiliates');
    Route::resource('users', UserController::class)->names('users');
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

  // 5. Fund
  Route::prefix('funds')->name('funds.')->group(function () {
    Route::get('wallets', function () {
      return inertia('admin/funds/wallets/index');
    })->name('wallets');
    Route::get('wallet-transactions', function () {
      return inertia('admin/funds/wallet-transactions/index');
    })->name('wallet-transactions');
    Route::get('withdrawals', function () {
      return inertia('admin/funds/withdrawals/index');
    })->name('withdrawals');
    Route::get('payment-history', function () {
      return inertia('admin/funds/payment-history/index');
    })->name('payment-history');
    Route::get('bank-accounts', function () {
      return inertia('admin/funds/bank-accounts/index');
    })->name('bank-accounts');
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
