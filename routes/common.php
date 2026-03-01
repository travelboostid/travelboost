<?php

use App\Http\Controllers\DefaultController;
use App\Http\Controllers\Webhooks\MidtransWebhookController;
use Illuminate\Support\Facades\Route;

Route::controller(DefaultController::class)->group(function () {
  Route::get('/', 'home')->name('home');
  Route::get('/about', 'about')->name('about');
  Route::get('/contact', 'contact')->name('contact');
  Route::get('/learn-more', 'learnMore')->name('learn-more');
  Route::get('/privacy', 'privacy')->name('privacy');
});
Route::prefix('webhooks')->group(function () {
  Route::middleware(['web'])->group(function () {
    Route::post('midtrans/notification', [MidtransWebhookController::class, 'handleNotification']);
  });
});
