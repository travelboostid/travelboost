<?php

use App\Http\Controllers\Webapi\Admin\MiscController;
use App\Http\Controllers\Webapi\AnonymousUserController;
use App\Http\Controllers\Webapi\BankAccountController;
use App\Http\Controllers\Webapi\ChatMessageController;
use App\Http\Controllers\Webapi\ChatRoomController;
use App\Http\Controllers\Webapi\CompanyController;
use App\Http\Controllers\Webapi\ContinentController;
use App\Http\Controllers\Webapi\CountryController;
use App\Http\Controllers\Webapi\GeoCityController;
use App\Http\Controllers\Webapi\GeoDistrictController;
use App\Http\Controllers\Webapi\GeoProvinceController;
use App\Http\Controllers\Webapi\GeoVillageController;
use App\Http\Controllers\Webapi\MediaController;
use App\Http\Controllers\Webapi\PaymentController;
use App\Http\Controllers\Webapi\PaymentMethodController;
use App\Http\Controllers\Webapi\RegionController;
use App\Http\Controllers\Webapi\TourCategoryController;
use App\Http\Controllers\Webapi\TourController;
use App\Http\Controllers\Webapi\UserController;
use App\Http\Controllers\Webapi\WalletController;
use App\Http\Controllers\Webapi\WithdrawalController;
use Illuminate\Support\Facades\Route;

Route::prefix('webapi')->group(function () {
    Route::middleware(['web', 'auth'])->group(function () {
        Route::apiResource('companies', CompanyController::class)->names([
            'index' => 'webapi.companies.index',
            'store' => 'webapi.companies.store',
            'show' => 'webapi.companies.show',
            'update' => 'webapi.companies.update',
            'destroy' => 'webapi.companies.destroy',
        ]);
        Route::apiResource('payments', PaymentController::class);
        Route::apiResource('withdrawals', WithdrawalController::class);
        Route::apiResource('bank-accounts', BankAccountController::class);
        Route::apiResource('users', UserController::class);
        Route::apiResource('medias', MediaController::class);
        Route::apiResource('wallets', WalletController::class);
        Route::apiResource('continents', ContinentController::class);
        Route::apiResource('regions', RegionController::class);
        Route::apiResource('countries', CountryController::class);
        Route::apiResource('categories', TourCategoryController::class);
        Route::get('companies/{company}/settings', [CompanyController::class, 'showSettings']);
        Route::put('companies/{company}/settings', [CompanyController::class, 'updateSettings']);
        Route::get('payment-methods', [PaymentMethodController::class, 'index']);
        Route::post('payments/create-topup-payment', [PaymentController::class, 'createTopupPayment']);
        Route::post('payments/create-agent-subscription-payment', [PaymentController::class, 'createAgentSubscriptionPayment']);
        Route::post('payments/create-ai-credit-topup-payment', [PaymentController::class, 'createAiCreditTopupPayment']);
    });

    Route::middleware(['web', 'auth'])->prefix('admin')->group(function () {
        Route::get('misc/search-companies', [MiscController::class, 'searchCompanies']);
        Route::get('misc/search-resource-owners', [MiscController::class, 'searchResourceOwners']);
    });

    Route::middleware(['web', 'auth'])->prefix('geo')->group(function () {
        Route::apiResource('provinces', GeoProvinceController::class);
        Route::apiResource('cities', GeoCityController::class);
        Route::apiResource('districts', GeoDistrictController::class);
        Route::apiResource('villages', GeoVillageController::class);
    });

    Route::middleware(['web'])->group(function () {
        Route::apiResource('tours', TourController::class);
        Route::post('anonymous-users/setup', [AnonymousUserController::class, 'setupAnonymousUser']);
        Route::apiResource('chat/rooms.messages', ChatMessageController::class)->shallow(); // Messages nested under rooms
        Route::apiResource('chat/rooms', ChatRoomController::class);
        Route::post('chat/rooms/open', [ChatRoomController::class, 'open']);
        Route::get('payment-methods', [PaymentMethodController::class, 'index']);
        Route::post('payments/create-topup-payment', [PaymentController::class, 'createTopupPayment']);
        Route::post('payments/create-agent-subscription-payment', [PaymentController::class, 'createAgentSubscriptionPayment']);
    });
});
