<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\Tenant\TourController;
use Illuminate\Support\Facades\Route;

$appHost = env('APP_HOST', 'localhost');

Route::domain('{username}.'.$appHost)->group(function () {
    Route::get('/tours', [TourController::class, 'index']);

    Route::middleware(['auth'])->group(function () {
        Route::get('/bookings/{tour}/create', [BookingController::class, 'create'])->name('bookings.create');
        Route::post('/bookings/{tour}/reserve', [BookingController::class, 'reserve'])->name('bookings.reserve');
        Route::post('/bookings/{tour}', [BookingController::class, 'store'])->name('bookings.store');
        Route::post('/bookings/{booking}/release-hold', [BookingController::class, 'releaseHold']);
        Route::post('/bookings/{booking}/travel-documents', [BookingController::class, 'updateTravelDocuments']);
        Route::get('/bookings/{booking}/payment-result', [BookingController::class, 'paymentResult']);
        Route::post('/bookings/{booking}/manual-payment', [BookingController::class, 'storeManualPayment']);
        Route::post('/bookings/{booking}/online-payment', [BookingController::class, 'storeOnlinePayment']);
        Route::post('/bookings/{booking}/online-payment/{payment}/confirm', [BookingController::class, 'confirmTenantOnlinePayment']);
    });
});
