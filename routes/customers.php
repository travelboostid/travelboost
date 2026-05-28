<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\Customers\AuthController;
use App\Http\Controllers\Customers\ProfileController as CustomerProfileController;
use App\Http\Controllers\Me\HomeController as MeHomeController;
use App\Http\Controllers\Tenant\TourController;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Route;

$appHost = env('APP_HOST', 'localhost');
Route::prefix('customers')
    ->middleware(['use-customer-props', 'set-and-use-anonymous-user-props', 'use-analytics-measurement-ids-props'])
    ->name('customers.')
    ->group(function () {
        Route::middleware(['guest'])->group(function () {
            Route::get('login', [AuthController::class, 'showLogin'])->name('login.show');
            Route::post('login', [AuthController::class, 'login'])->name('login.store');
            Route::get('register', [AuthController::class, 'showRegister'])->name('register.show');
            Route::post('register', [AuthController::class, 'register'])->name('register.store');
        });
    });
Route::domain('{username}.'.$appHost)->middleware(['use-customer-props',  'use-analytics-measurement-ids-props'])->group(function () {
    Route::get('/tours', [TourController::class, 'index']);
    Route::get('/mybookings', [MeHomeController::class, 'bookings']);
    Route::get('/mybookings/{booking}/invoice', function (Request $request, string $username, Booking $booking): HttpResponse {
        return app(MeHomeController::class)->bookingInvoice($request, $booking);
    })->middleware('auth');

    Route::middleware(['auth'])->group(function () {
        Route::get('/customers/profile', [CustomerProfileController::class, 'edit'])->name('customers.profile.edit');
        Route::patch('/customers/profile', [CustomerProfileController::class, 'update'])->name('customers.profile.update');
        Route::put('/customers/profile/password', [CustomerProfileController::class, 'updatePassword'])->name('customers.profile.password.update');
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
