<?php

use App\Http\Controllers\Companies\Web\CompanyPublicController;
use App\Http\Controllers\Companies\Dashboard\AgentTourController;
use App\Http\Controllers\Companies\Dashboard\BankAccountController;
use App\Http\Controllers\Companies\Dashboard\CategoryController;
use App\Http\Controllers\Companies\Dashboard\HomeController;
use App\Http\Controllers\Companies\Dashboard\MemberController;
use App\Http\Controllers\Companies\Dashboard\MemberInvitationController;
use App\Http\Controllers\Companies\Dashboard\PaymentController;
use App\Http\Controllers\Companies\Dashboard\ProfileSettingsController;
use App\Http\Controllers\Companies\Dashboard\TourController;
use App\Http\Controllers\Companies\Dashboard\VendorTourCatalogController;
use App\Http\Controllers\Companies\Dashboard\WalletController;
use App\Http\Controllers\Companies\Dashboard\WalletTransactionsController;
use App\Http\Controllers\Companies\Dashboard\WithdrawalController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;

Route::middleware('auth')->prefix('companies/{company:username}/dashboard')->name('company.')->group(function () {
  Route::get('/', [HomeController::class, 'index'])->name('index');
  Route::get('vendors/{vendor}/tours', [VendorTourCatalogController::class, 'index'])->name('vendor-tour.index');
  Route::post('vendors/{vendor}/tours/{tour}/copy', [VendorTourCatalogController::class, 'copy'])->name('vendor-tour.copy');
  Route::get('vendors/{vendor}/tours/{tour}/brochure', [VendorTourCatalogController::class, 'viewBrochure'])->name('vendor-tour.view-brochure');
  Route::get('tours', [TourController::class, 'index'])->name('tour.index');
  Route::get('tours/create', [TourController::class, 'create'])->name('tour.create');
  Route::post('tours', [TourController::class, 'store'])->name('tour.store');
  Route::get('tours/{tour}/edit', [TourController::class, 'edit'])->name('tour.edit');
  Route::put('tours/{tour}', [TourController::class, 'update'])->name('tour.update');
  Route::delete('tours/{tour}', [TourController::class, 'destroy'])->name('tour.destroy');
  Route::get('agent-tours', [AgentTourController::class, 'index'])->name('agent-tour.index');
  Route::delete('agent-tours/{tour}', [AgentTourController::class, 'destroy'])->name('agent-tour.destroy');
  Route::get('categories', [CategoryController::class, 'index'])->name('category.index');
  Route::post('categories', [CategoryController::class, 'store'])->name('category.store');
  Route::put('categories/{category}', [CategoryController::class, 'update'])->name('category.update');
  Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('category.destroy');
  Route::get('wallets', [WalletController::class, 'index'])->name('wallet.index');
  Route::get('payments', [PaymentController::class, 'index'])->name('payments.index');
  Route::post('payments/{payment}', [PaymentController::class, 'cancel'])->name('payments.cancel');
  Route::get('bank-accounts', [BankAccountController::class, 'index'])->name('bank-account.index');
  Route::post('bank-accounts', [BankAccountController::class, 'store'])->name('bank-account.store');
  Route::put('bank-accounts/{bankAccount}', [BankAccountController::class, 'update'])->name('bank-account.update');
  Route::delete('bank-accounts/{bankAccount}', [BankAccountController::class, 'destroy'])->name('bank-account.destroy');
  Route::get('wallet-transactions', [WalletTransactionsController::class, 'index'])->name('wallet-transaction.index');
  Route::get('withdrawals', [WithdrawalController::class, 'index'])->name('withdrawal.index');
  Route::get('settings/profile', [ProfileSettingsController::class, 'show'])->name('settings.profile.show');
  Route::put('settings/profile', [ProfileSettingsController::class, 'update'])->name('settings.profile.update');
  Route::resource('settings/members', MemberController::class);
  Route::resource('settings/member-invitations', MemberInvitationController::class);
});

Route::prefix('{company:username}')->where(['company' => '[A-Za-z0-9._-]+'])->name('pub.company.')->group(function () {
  Route::get('/', [CompanyPublicController::class, 'showLandingPage']);
  Route::get('/design', [CompanyPublicController::class, 'editLandingPage']);
  Route::put('/design', [CompanyPublicController::class, 'updateLandingPage']);
  Route::get('/tours', [CompanyPublicController::class, 'showTours']);
  Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
  Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
});
