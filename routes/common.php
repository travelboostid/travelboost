<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\CaddyController;
use App\Http\Controllers\Google\GoogleAuthController;
use App\Http\Controllers\HomeController as BaseHomeController;
use App\Http\Controllers\HomeDispatcherController;
use App\Http\Controllers\Webhooks\MidtransWebhookController;
use App\Http\Middleware\DomainResolver;
use Illuminate\Support\Facades\Route;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

Route::get('/', HomeDispatcherController::class)->name('index');
Route::get('/about', [BaseHomeController::class, 'about'])->name('about');
Route::get('/contact', [BaseHomeController::class, 'contact'])->name('contact');
Route::get('/learn-more', [BaseHomeController::class, 'learnMore'])->name('learn-more');
Route::get('/privacy', [BaseHomeController::class, 'privacy'])->name('privacy');
Route::get('/tours', [BaseHomeController::class, 'tours'])->name('tours');
Route::redirect('/login', '/customers/login')->name('login');

Route::middleware(['auth'])->group(function () {
    Route::post('/bookings/{booking}/reorder', [BookingController::class, 'reorder'])
        ->name('customer.bookings.reorder');
    Route::post('/bookings/{booking}/release-hold', [BookingController::class, 'releaseHold'])
        ->name('customer.bookings.release-hold');
    Route::put('/bookings/{booking}', [BookingController::class, 'update'])
        ->name('customer.bookings.update');
    Route::post('/bookings/{booking}/travel-documents', [BookingController::class, 'updateTravelDocuments'])
        ->name('customer.bookings.travel-documents');
    Route::get('/bookings/{booking}/payment-result', [BookingController::class, 'paymentResult'])
        ->name('customer.bookings.payment-result');
    Route::post('/bookings/{booking}/manual-payment', [BookingController::class, 'storeManualPayment'])
        ->name('customer.bookings.manual-payment');
    Route::post('/bookings/{booking}/online-payment', [BookingController::class, 'storeOnlinePayment'])
        ->name('customer.bookings.online-payment');
    Route::post('/bookings/{booking}/online-payment/{payment}/confirm', [BookingController::class, 'confirmOnlinePayment'])
        ->name('customer.bookings.online-payment.confirm');
});

Route::prefix('webhooks')->group(function () {
    Route::middleware(['web'])->group(function () {
        Route::post('midtrans/notification', [MidtransWebhookController::class, 'handleNotification']);
    });
});

Route::prefix('api/regions')->group(function () {
    Route::get('provinces', fn () => response()->json(Province::orderBy('name')->get()));
    Route::get('cities/{province}', fn ($province) => response()->json(City::where('province_code', $province)->orderBy('name')->get()));
    Route::get('districts/{city}', fn ($city) => response()->json(District::where('city_code', $city)->orderBy('name')->get()));
    Route::get('villages/{district}', fn ($district) => response()->json(Village::where('district_code', $district)->orderBy('name')->get()));
});
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);
Route::get('/caddy/verify-domain', [CaddyController::class, 'verifyDomain'])->withoutMiddleware([
    DomainResolver::class,
]);
