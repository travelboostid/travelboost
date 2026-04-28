<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\Affiliate\LandingController as AffiliateHomeController;
use App\Http\Controllers\AgentAuthController;
use App\Http\Controllers\AuthController as BaseAuthController;
use App\Http\Controllers\CustomerAuthController;
use App\Http\Controllers\HomeController as BaseHomeController;
use App\Http\Controllers\TeamInvitationAuthController;
use App\Http\Controllers\Tenant\HomeController as TenantHomeController;
use App\Http\Controllers\VendorAuthController;
use App\Http\Controllers\Webhooks\MidtransWebhookController;
use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\Domain;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Route;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;
use Symfony\Component\HttpFoundation\Request;

Route::get('/', function () {
  $affiliateBaseUrl = 'affiliate.' . env('APP_HOST', 'localhost');
  $domain = Context::get('domain');
  $owner = $domain?->owner;

  return match (true) {
    $affiliateBaseUrl === request()->getHost() => app(AffiliateHomeController::class)->index(),
    $owner instanceof Company => app(TenantHomeController::class)->index(),
    $owner instanceof AffiliateProfile => in_array($owner->tier, ['master_affiliate', 'partner'])
      ? inertia('affiliate/landing', ['referral_code' => $owner->referral_code])
      : inertia('home/index', ['referral_code' => $owner->referral_code]),
    default => app(BaseHomeController::class)->index(),
  };
})->name('index');

Route::get('/about', [BaseHomeController::class, 'about'])->name('about');
Route::get('/contact', [BaseHomeController::class, 'contact'])->name('contact');
Route::get('/learn-more', [BaseHomeController::class, 'learnMore'])->name('learn-more');
Route::get('/privacy', [BaseHomeController::class, 'privacy'])->name('privacy');
Route::get('/tours', [BaseHomeController::class, 'tours'])->name('tours');

Route::middleware(['guest'])->group(function () {
  Route::get('/agent/login', [AgentAuthController::class, 'showLogin'])->name('agent.login');
  Route::post('/agent/login', [AgentAuthController::class, 'login']);
  Route::get('/agent/register', [AgentAuthController::class, 'showRegister'])->name('agent.register');

  Route::get('/vendor/login', [VendorAuthController::class, 'showLogin'])->name('vendor.login');
  Route::post('/vendor/login', [VendorAuthController::class, 'login']);
  Route::get('/vendor/register', [VendorAuthController::class, 'showRegister'])->name('vendor.register');

  Route::get('/customer/login', [CustomerAuthController::class, 'showLogin'])->name('customer.login');
  Route::get('/customer/register', [CustomerAuthController::class, 'showRegister'])->name('customer.register');

  Route::get('/admin/login', [AdminAuthController::class, 'showLogin'])->name('admin.login');
  Route::get('/team-invitation/accept', [TeamInvitationAuthController::class, 'showAccept'])->name('team-invitation.accept');
});

Route::get('/login', function (Request $request) {
  return app(BaseAuthController::class)->showLogin($request);
})->name('login');

Route::get('/register', [BaseAuthController::class, 'showRegister'])->name('register');

Route::prefix('webhooks')->group(function () {
  Route::middleware(['web'])->group(function () {
    Route::post('midtrans/notification', [MidtransWebhookController::class, 'handleNotification']);
  });
});

Route::prefix('api/regions')->group(function () {
  Route::get('provinces', fn() => response()->json(Province::orderBy('name')->get()));
  Route::get('cities/{province}', fn($province) => response()->json(City::where('province_code', $province)->orderBy('name')->get()));
  Route::get('districts/{city}', fn($city) => response()->json(District::where('city_code', $city)->orderBy('name')->get()));
  Route::get('villages/{district}', fn($district) => response()->json(Village::where('district_code', $district)->orderBy('name')->get()));
});
