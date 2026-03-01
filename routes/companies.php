<?php

use App\Http\Controllers\Companies\Dashboard\AgentTourController;
use App\Http\Controllers\Companies\Dashboard\BankAccountController;
use App\Http\Controllers\Companies\Dashboard\CategoryController;
use App\Http\Controllers\Companies\Dashboard\CustomerController;
use App\Http\Controllers\Companies\Dashboard\HomeController;
use App\Http\Controllers\Companies\Dashboard\MemberController;
use App\Http\Controllers\Companies\Dashboard\MemberInvitationController;
use App\Http\Controllers\Companies\Dashboard\PageController;
use App\Http\Controllers\Companies\Dashboard\PaymentController;
use App\Http\Controllers\Companies\Dashboard\ProfileSettingsController;
use App\Http\Controllers\Companies\Dashboard\TourController;
use App\Http\Controllers\Companies\Dashboard\VendorTourCatalogController;
use App\Http\Controllers\Companies\Dashboard\WalletController;
use App\Http\Controllers\Companies\Dashboard\WalletTransactionsController;
use App\Http\Controllers\Companies\Dashboard\WithdrawalController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('companies/{company:username}/dashboard')->name('company.')->group(function () {
  Route::get('/', [HomeController::class, 'index'])->name('index');
  Route::group(['prefix' => 'vendors/{vendor}', 'as' => 'vendor.'], function () {
    Route::resource('tours', VendorTourCatalogController::class);
    Route::post('/tours/{tour}/copy', [VendorTourCatalogController::class, 'copy'])->name('tour.copy');
    Route::get('/tours/{tour}/brochure', [VendorTourCatalogController::class, 'viewBrochure'])->name('tour.view-brochure');
  });
  Route::resource('tours', TourController::class);
  Route::resource('agent-tours', AgentTourController::class);
  Route::resource('categories', CategoryController::class);
  Route::resource('wallets', WalletController::class);
  Route::resource('payments', PaymentController::class);
  Route::resource('payments', PaymentController::class);
  Route::post('payments/{payment}/cancel', [PaymentController::class, 'cancel'])->name('payments.cancel');
  Route::resource('bank-accounts', BankAccountController::class);
  Route::get('wallet-transactions', [WalletTransactionsController::class, 'index'])->name('wallet-transaction.index');
  Route::get('withdrawals', [WithdrawalController::class, 'index'])->name('withdrawal.index');
  Route::get('settings/profile', [ProfileSettingsController::class, 'show'])->name('settings.profile.show');
  Route::put('settings/profile', [ProfileSettingsController::class, 'update'])->name('settings.profile.update');
  Route::resource('settings/members', MemberController::class);
  Route::resource('settings/member-invitations', MemberInvitationController::class);
  Route::resource('customers', CustomerController::class);
  Route::singleton('page', PageController::class);
});
