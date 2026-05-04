<?php

use App\Http\Controllers\Companies\Dashboard\AgentRegistrationController;
use App\Http\Controllers\Companies\Dashboard\AgentSubscriptionController;
use App\Http\Controllers\Companies\Dashboard\AgentTourController;
use App\Http\Controllers\Companies\Dashboard\BankAccountController;
use App\Http\Controllers\Companies\Dashboard\BookingIndexController;
use App\Http\Controllers\Companies\Dashboard\CategoryController;
use App\Http\Controllers\Companies\Dashboard\ChatbotController;
use App\Http\Controllers\Companies\Dashboard\CustomerController;
use App\Http\Controllers\Companies\Dashboard\HomeController;
use App\Http\Controllers\Companies\Dashboard\NotificationController;
use App\Http\Controllers\Companies\Dashboard\PageController;
use App\Http\Controllers\Companies\Dashboard\ParameterVendorController;
use App\Http\Controllers\Companies\Dashboard\PaymentController;
use App\Http\Controllers\Companies\Dashboard\ProfileController;
use App\Http\Controllers\Companies\Dashboard\RoleController;
use App\Http\Controllers\Companies\Dashboard\TeamController;
use App\Http\Controllers\Companies\Dashboard\TourAddOnController;
use App\Http\Controllers\Companies\Dashboard\TourAvailabilityController;
use App\Http\Controllers\Companies\Dashboard\TourController;
use App\Http\Controllers\Companies\Dashboard\VendorRegistrationController;
use App\Http\Controllers\Companies\Dashboard\VendorTourCatalogController;
use App\Http\Controllers\Companies\Dashboard\WalletController;
use App\Http\Controllers\Companies\Dashboard\WalletTransactionsController;
use App\Http\Controllers\Companies\Dashboard\WithdrawalController;
use App\Http\Controllers\Companies\IndexController;
use Illuminate\Support\Facades\Route;

Route::get('/companies', [IndexController::class, 'show'])->name('companies.show');
Route::prefix('companies/{company:username}/dashboard')->middleware(['auth'])->name('companies.dashboard.')->group(function () {
  Route::group(['prefix' => 'vendors/{vendor}', 'as' => 'vendor.'], function () {
    Route::get('/tours/{tour}/brochure', [VendorTourCatalogController::class, 'viewBrochure'])->name('tour.view-brochure');
  });
});

Route::prefix('companies/{company:username}/dashboard')->middleware(['auth', 'company.access'])->name('companies.dashboard.')->group(function () {
  Route::get('/', [HomeController::class, 'index'])->name('index');
  Route::group(['prefix' => 'vendors/{vendor}', 'as' => 'vendor.'], function () {
    Route::get('/tours', [VendorTourCatalogController::class, 'index'])->name('tours.index');
    Route::middleware(['agent.subscription.active'])->post('/tours/{tour}/copy', [VendorTourCatalogController::class, 'copy'])->name('tour.copy');
    // Route::get('/tours/{tour}/brochure', [VendorTourCatalogController::class, 'viewBrochure'])->name('tour.view-brochure');
  });

  Route::resource('agent-registrations', AgentRegistrationController::class);
  Route::middleware(['agent.subscription.active'])->resource('vendor-registrations', VendorRegistrationController::class);
  Route::middleware(['agent.subscription.active'])->post('vendor-registrations/register', [VendorRegistrationController::class, 'register'])->name('vendor-registrations.register');
  Route::resource('tours', TourController::class);

  Route::delete(
    'tours/{tour}/schedules/{schedule}',
      [TourController::class, 'destroySchedule']
  )->name('tours.schedule.destroy');

  Route::delete(
    'tours/{tour}/prices/{price}',
      [TourController::class, 'destroyPrice']
  )->name('tours.prices.destroy');

  Route::post(
    'tour-availabilities',
    [TourAvailabilityController::class, 'store']
  )->name('tour-availabilities.store');

  Route::post(
    'tour-add-ons',
    [TourAddOnController::class, 'store']
  )->name('tour-add-ons.store');

  Route::resource('agent-tours', AgentTourController::class);
  Route::resource('categories', CategoryController::class);
  Route::resource('wallets', WalletController::class);
  Route::resource('payments', PaymentController::class);
  Route::post('payments/{payment}/cancel', [PaymentController::class, 'cancel'])->name('payments.cancel');
  Route::resource('bank-accounts', BankAccountController::class);
  Route::get('wallet-transactions', [WalletTransactionsController::class, 'index'])->name('wallet-transaction.index');
  Route::get('withdrawals', [WithdrawalController::class, 'index'])->name('withdrawal.index');
  Route::get('profile', [ProfileController::class, 'show'])->name('settings.profile.show');

  Route::get(
      'parameter-vendor',
      [ParameterVendorController::class, 'index']
  )->name('parameter-vendor.index');

  Route::put(
    'parameter-vendor',
    [ParameterVendorController::class, 'update']
  )->name('parameter-vendor.update');

  Route::put('profile', [ProfileController::class, 'update'])->name('settings.profile.update');
  Route::post('teams/invite', [TeamController::class, 'invite'])->name('teams.invite');
  Route::resource('teams', TeamController::class);
  Route::post('teams/{team}/resend-invitation', [TeamController::class, 'resendInvitation'])->name('teams.resend-invitation');
  Route::resource('roles', RoleController::class);
  Route::resource('customers', CustomerController::class);
  Route::get('bookings', [BookingIndexController::class, 'index'])->name('bookings.index');
  Route::get('bookings/{booking}', [BookingIndexController::class, 'show'])->name('bookings.show');
  Route::get('bookings/{booking}/edit', [BookingIndexController::class, 'edit'])->name('bookings.edit');
  Route::put('bookings/{booking}', [BookingIndexController::class, 'update'])->name('bookings.update');
  Route::singleton('chatbot', ChatbotController::class);
  Route::singleton('page', PageController::class);
  Route::singleton('agent-subscriptions', AgentSubscriptionController::class);

  Route::post('notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
  Route::resource('notifications', NotificationController::class)->only(['index', 'update', 'destroy']);
});

Route::get(
  '/brochure/{vendor}/{tour}',
  [VendorTourCatalogController::class, 'viewPublicBrochure']
)->name('brochure.public');
//