<?php

use App\Http\Controllers\Webapi\BankAccountController;
use App\Http\Controllers\Webapi\ChatMessageController;
use App\Http\Controllers\Webapi\ChatRoomController;
use App\Http\Controllers\Webapi\CompanyController;
use App\Http\Controllers\Webapi\MediaController;
use App\Http\Controllers\Webapi\PaymentController;
use App\Http\Controllers\Webapi\TourCategoryController;
use App\Http\Controllers\Webapi\UserController;
use App\Http\Controllers\Webapi\TourController;
use App\Http\Controllers\Webapi\UserPreferenceController;
use App\Http\Controllers\Webapi\WalletController;
use App\Http\Controllers\Webapi\WithdrawalController;
use Illuminate\Support\Facades\Route;

Route::prefix('webapi')->group(function () {
  Route::middleware(['web', 'auth'])->group(function () {
    Route::apiResource('companies', CompanyController::class);
    Route::apiResource('tours', TourController::class);
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('withdrawals', WithdrawalController::class);
    Route::apiResource('bank-accounts', BankAccountController::class);
    Route::apiResource('users', UserController::class);
    Route::apiResource('medias', MediaController::class);
    Route::apiResource('wallets', WalletController::class);
    Route::apiResource('categories', TourCategoryController::class)->only(['store', 'update', 'destroy']);
    Route::get('companies/{company}/settings', [CompanyController::class, 'showSettings']);
    Route::put('companies/{company}/settings', [CompanyController::class, 'updateSettings']);
    Route::apiResource('chat/rooms', ChatRoomController::class);
    Route::post('chat/rooms/open', [ChatRoomController::class, 'open']);

    // Messages nested under rooms
    Route::apiResource('chat/rooms.messages', ChatMessageController::class)
      ->shallow();
    Route::post('payments/topup', [PaymentController::class, 'topup']);
  });
  Route::apiResource('categories', TourCategoryController::class)->only(methods: ['index', 'show']);
});
