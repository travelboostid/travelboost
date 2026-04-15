<?php

use App\Http\Controllers\HomeController as BaseHomeController;
use App\Http\Controllers\AuthController as BaseAuthController;
use App\Http\Controllers\Tenant\HomeController as TenantHomeController;
use App\Http\Controllers\Affiliate\LandingController as AffiliateHomeController;
use App\Http\Controllers\Auth\AffiliateAuthController;
use App\Http\Controllers\Webhooks\MidtransWebhookController;
use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\Domain;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Request;

Route::get('/', function () {
  $affiliateBaseUrl = 'affiliate.' . env('APP_HOST', 'localhost');
  /** @var Domain|null $domain */
  $domain = Context::get('domain');
  $owner = $domain?->owner;

  return match (true) {
    $affiliateBaseUrl === request()->getHost() => app(AffiliateHomeController::class)->index(),
    $owner instanceof Company => app(TenantHomeController::class)->index(),
    $owner instanceof AffiliateProfile => app(AffiliateHomeController::class)->index(),
    default => app(BaseHomeController::class)->index(),
  };
})->name('index');
Route::get('/about', [BaseHomeController::class, 'about'])->name('about');
Route::get('/contact', [BaseHomeController::class, 'contact'])->name('contact');
Route::get('/learn-more', [BaseHomeController::class, 'learnMore'])->name('learn-more');
Route::get('/privacy', [BaseHomeController::class, 'privacy'])->name('privacy');
Route::get('/tours', [BaseHomeController::class, 'tours'])->name('tours');
Route::get('/login', function (Request $request) {
  /** @var Domain|null $domain */
  $domain = Context::get('domain');
  $owner = $domain?->owner;

  return match (true) {
    $owner instanceof Company => app(TenantHomeController::class)->index(),
    $owner instanceof AffiliateProfile => app(AffiliateAuthController::class)->showLogin(),
    default => app(BaseAuthController::class)->showLogin($request),
  };
})->name('login');
Route::get('/register', function (Request $request) {
  /** @var Domain|null $domain */
  $domain = Context::get('domain');
  $owner = $domain?->owner;

  return match (true) {
    $owner instanceof AffiliateProfile => app(AffiliateAuthController::class)->showRegister($request),
    default => app(BaseAuthController::class)->showRegister($request),
  };
})->name('register');

Route::prefix('webhooks')->group(function () {
  Route::middleware(['web'])->group(function () {
    Route::post('midtrans/notification', [MidtransWebhookController::class, 'handleNotification']);
  });
});
