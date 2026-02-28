<?php

use App\Http\Controllers\Companies\Web\CompanyPublicController;
use App\Http\Controllers\Companies\Web\CompanyRootController;
use App\Http\Controllers\DefaultController;
use App\Http\Controllers\Webhooks\MidtransWebhookController;
use Illuminate\Support\Facades\Route;

Route::domain('app.local')->group(function () {
  Route::get('/', [CompanyRootController::class, 'showLandingPage']);
});


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

require __DIR__ . '/me.php';
require __DIR__ . '/webapi.php';
require __DIR__ . '/companies.php';


// Route::middleware(['custom.domain'])->group(function () {

//   Route::get('/', [PersonalPageController::class, 'showByDomain']);

//   Route::get('/{slug?}', [PersonalPageController::class, 'showByDomain'])
//     ->where('slug', '.*');
// });
