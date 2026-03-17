<?php

use App\Http\Controllers\Companies\Dashboard\AgentRegistrationController;
use App\Http\Controllers\Companies\Dashboard\AgentTourController;
use App\Http\Controllers\Companies\Dashboard\BankAccountController;
use App\Http\Controllers\Companies\Dashboard\CategoryController;
use App\Http\Controllers\Companies\Dashboard\ChatbotController;
use App\Http\Controllers\Companies\Dashboard\CustomerController;
use App\Http\Controllers\Companies\Dashboard\HomeController;
use App\Http\Controllers\Companies\Dashboard\PageController;
use App\Http\Controllers\Companies\Dashboard\PaymentController;
use App\Http\Controllers\Companies\Dashboard\ProfileController;
use App\Http\Controllers\Companies\Dashboard\RoleController;
use App\Http\Controllers\Companies\Dashboard\TeamController;
use App\Http\Controllers\Companies\Dashboard\TourController;
use App\Http\Controllers\Companies\Dashboard\VendorRegistrationController;
use App\Http\Controllers\Companies\Dashboard\VendorTourCatalogController;
use App\Http\Controllers\Companies\Dashboard\WalletController;
use App\Http\Controllers\Companies\Dashboard\WalletTransactionsController;
use App\Http\Controllers\Companies\Dashboard\WithdrawalController;
use Illuminate\Support\Facades\Route;

Route::prefix('companies/{company:username}/dashboard')->middleware(['auth'])->name('company.')->group(function () {
  Route::group(['prefix' => 'vendors/{vendor}', 'as' => 'vendor.'], function () {
    Route::get('/tours/{tour}/brochure', [VendorTourCatalogController::class, 'viewBrochure'])->name('tour.view-brochure');
  });
});

Route::prefix('companies/{company:username}/dashboard')->middleware(['auth', 'company.access'])->name('company.')->group(function () {
  Route::get('/', [HomeController::class, 'index'])->name('index');
  Route::group(['prefix' => 'vendors/{vendor}', 'as' => 'vendor.'], function () {
    Route::get('/tours', [VendorTourCatalogController::class, 'index'])->name('tours.index');
    Route::post('/tours/{tour}/copy', [VendorTourCatalogController::class, 'copy'])->name('tour.copy');
    //Route::get('/tours/{tour}/brochure', [VendorTourCatalogController::class, 'viewBrochure'])->name('tour.view-brochure');
  });
  Route::resource('agent-registrations', AgentRegistrationController::class);
  Route::resource('vendor-registrations', VendorRegistrationController::class);
  Route::post('vendor-registrations/register', [VendorRegistrationController::class, 'register'])->name('vendor-registrations.register');
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
  Route::get('profile', [ProfileController::class, 'show'])->name('settings.profile.show');
  Route::put('profile', [ProfileController::class, 'update'])->name('settings.profile.update');
  Route::post('teams/invite', [TeamController::class, 'invite'])->name('teams.invite');
  Route::resource('teams', TeamController::class);
  Route::post('teams/{team}/resend-invitation', [TeamController::class, 'resendInvitation'])->name('teams.resend-invitation');
  Route::resource('roles', RoleController::class);
  Route::resource('customers', CustomerController::class);
  Route::singleton('chatbot', ChatbotController::class);
  Route::singleton('page', PageController::class);
});
