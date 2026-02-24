<?php

use App\Http\Controllers\DashboardWithdrawalController;
use App\Http\Controllers\Webapi\BankAccountController;
use App\Http\Controllers\Webapi\ChatMessageController;
use App\Http\Controllers\Webapi\ChatRoomController;
use App\Http\Controllers\Webapi\MediaController;
use App\Http\Controllers\Webapi\PaymentController;
use App\Http\Controllers\Webapi\TourCategoryController;
//23022026 add for continent options
use App\Http\Controllers\Webapi\ContinentController;
use App\Http\Controllers\Webapi\RegionController;
use App\Http\Controllers\Webapi\CountryController;
use App\Http\Controllers\Webapi\UserController;
use App\Http\Controllers\DashboardBankAccountController;
use App\Http\Controllers\DashboardTourController;
use App\Http\Controllers\DashboardVendorController;
use App\Http\Controllers\DashboardCategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DashboardPaymentController;
use App\Http\Controllers\DashboardSettingsChangePasswordController;
use App\Http\Controllers\DashboardSettingsPreferencesController;
use App\Http\Controllers\DashboardSettingsProfileController;
use App\Http\Controllers\DashboardWalletController;
use App\Http\Controllers\DashboardWalletTransactionsController;
use App\Http\Controllers\PersonalPageController;
use App\Http\Controllers\DefaultController;
use App\Http\Controllers\Webapi\TourController;
use App\Http\Controllers\Webapi\UserPreferenceController;
use App\Http\Controllers\Webapi\WalletController;
use App\Http\Controllers\Webapi\WithdrawalController;
use App\Http\Controllers\Webhooks\MidtransWebhookController;
use Illuminate\Support\Facades\Route;

Route::prefix('dashboard')->middleware(['auth'])->group(function () {
  Route::get('/',  [DashboardController::class, 'index']);
  Route::resource('tours', DashboardTourController::class);
  Route::get('vendors/{username}/tours',  [DashboardVendorController::class, 'tours']);
  Route::post('vendors/{username}/tours/{tour}/copy',  [DashboardVendorController::class, 'copy']);
  Route::get('vendors/{username}/tours/{tour}/brochure',  [DashboardVendorController::class, 'brochure']);
  Route::resource('categories', DashboardCategoryController::class);
  Route::prefix('settings')->group(function () {
    Route::singleton('profile', DashboardSettingsProfileController::class);
    Route::singleton('preferences', DashboardSettingsPreferencesController::class);
    Route::singleton('change-password', DashboardSettingsChangePasswordController::class);
  });
  Route::prefix('funds')->group(function () {
    Route::resource('bank-accounts', DashboardBankAccountController::class);
    Route::resource('payments', DashboardPaymentController::class);
    Route::resource('withdrawals', DashboardWithdrawalController::class);
    Route::put('withdrawals/{withdrawal}/cancel', [DashboardWithdrawalController::class, 'cancel'])
      ->name('withdrawals.cancel');
    Route::put('payments/{payment}/cancel', [DashboardPaymentController::class, 'cancel'])
      ->name('payments.cancel');
    Route::get('wallets', [DashboardWalletController::class, 'show']);
    Route::get('wallet-transactions', [DashboardWalletTransactionsController::class, 'index']);
  });
});
Route::prefix('webapi')->group(function () {
  Route::middleware(['web', 'auth'])->group(function () {
    Route::apiResource('tours', TourController::class);
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('withdrawals', WithdrawalController::class);
    Route::apiResource('bank-accounts', BankAccountController::class);
    Route::apiResource('users', UserController::class);
    Route::apiResource('medias', MediaController::class);
    Route::apiResource('wallets', WalletController::class);
    Route::apiResource('categories', TourCategoryController::class)->only(['store', 'update', 'destroy']);
    //23022026 add for continent options
    Route::apiResource('continents', ContinentController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('regions', RegionController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('countries', CountryController::class)->only(['store', 'update', 'destroy']);
    Route::singleton('users.preference', UserPreferenceController::class)
      ->only(['update']);
    // Rooms
    Route::apiResource('chat/rooms', ChatRoomController::class);
    Route::post('chat/rooms/open', [ChatRoomController::class, 'open']);

    // Messages nested under rooms
    Route::apiResource('chat/rooms.messages', ChatMessageController::class)
      ->shallow();
    Route::post('payments/topup', [PaymentController::class, 'topup']);
  });
  Route::apiResource('categories', TourCategoryController::class)->only(methods: ['index', 'show']);
  //23022026 add for continent options
  Route::apiResource('continents', ContinentController::class)->only(methods: ['index', 'show']);
  Route::apiResource('regions', RegionController::class)->only(methods: ['index', 'show']);
  Route::apiResource('countries', CountryController::class)->only(methods: ['index', 'show']);
});

Route::prefix('webhooks')->group(function () {
  Route::middleware(['web'])->group(function () {
    Route::post('midtrans/notification', [MidtransWebhookController::class, 'handleNotification']);
  });
});


Route::controller(DefaultController::class)->group(function () {
  Route::get('/', 'home')->name('home');
  Route::get('/about', 'about')->name('about');
  Route::get('/contact', 'contact')->name('contact');
  Route::get('/learn-more', 'learnMore')->name('learn-more');
  Route::get('/privacy', 'privacy')->name('privacy');
});
Route::get('/{username}', [PersonalPageController::class, 'show'])
  ->where('username', '[A-Za-z0-9._-]+');
Route::get('/{username}/design', [PersonalPageController::class, 'edit'])
  ->where('username', '[A-Za-z0-9._-]+');
Route::put('/{username}/design', [PersonalPageController::class, 'update'])
  ->where('username', '[A-Za-z0-9._-]+');
Route::get('/{username}/tours', [PersonalPageController::class, 'tours'])
  ->where('username', '[A-Za-z0-9._-]+');

// require __DIR__ . '/settings.php';
