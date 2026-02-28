<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\VendorController;
use App\Http\Controllers\Admin\AgentController;
use App\Http\Controllers\Admin\AffiliateController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\TourController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\VendorCatalogController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\WalletController;
use App\Http\Controllers\Admin\WalletTransactionController;
use App\Http\Controllers\Admin\WithdrawalController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\BankAccountController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\InventoryStatusController;
use App\Http\Controllers\Admin\UserManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
  Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

  Route::prefix('vendors')->name('vendors.')->group(function () {
    Route::get('', [VendorController::class, 'index'])->name('index');
  });

  Route::prefix('agents')->name('agents.')->group(function () {
    Route::get('', [AgentController::class, 'index'])->name('index');
  });

  Route::prefix('affiliates')->name('affiliates.')->group(function () {
    Route::get('', [AffiliateController::class, 'index'])->name('index');
  });

  Route::prefix('customers')->name('customers.')->group(function () {
    Route::get('', [CustomerController::class, 'index'])->name('index');
  });

  Route::prefix('tours')->name('tours.')->group(function () {
    Route::get('', [TourController::class, 'index'])->name('index');
  });

  Route::prefix('products')->name('products.')->group(function () {
    Route::get('', [ProductController::class, 'index'])->name('index');
  });

  Route::prefix('vendor-catalog')->name('vendor-catalog.')->group(function () {
    Route::get('', [VendorCatalogController::class, 'index'])->name('index');
  });

  Route::prefix('bookings')->name('bookings.')->group(function () {
    Route::get('', [BookingController::class, 'index'])->name('index');
  });

  Route::prefix('wallets')->name('wallets.')->group(function () {
    Route::get('', [WalletController::class, 'index'])->name('index');
  });

  Route::prefix('wallet-transactions')->name('wallet-transactions.')->group(function () {
    Route::get('', [WalletTransactionController::class, 'index'])->name('index');
  });

  Route::prefix('withdrawals')->name('withdrawals.')->group(function () {
    Route::get('', [WithdrawalController::class, 'index'])->name('index');
  });

  Route::prefix('payments')->name('payments.')->group(function () {
    Route::get('', [PaymentController::class, 'index'])->name('index');
  });

  Route::prefix('bank-accounts')->name('bank-accounts.')->group(function () {
    Route::get('', [BankAccountController::class, 'index'])->name('index');
  });

  Route::prefix('reports')->name('reports.')->group(function () {
    Route::get('', [ReportController::class, 'index'])->name('index');
  });

  Route::prefix('inventory-status')->name('inventory-status.')->group(function () {
    Route::get('', [InventoryStatusController::class, 'index'])->name('index');
  });

  Route::prefix('users')->name('users.')->group(function () {
    Route::get('', [UserManagementController::class, 'index'])->name('index');
  });
});
