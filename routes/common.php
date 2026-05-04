<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Affiliate\LandingController as AffiliateHomeController;
use App\Http\Controllers\Companies\AuthController as CompaniesAuthController;
use App\Http\Controllers\Customers\AuthController as CustomerAuthController;
use App\Http\Controllers\HomeController as BaseHomeController;
use App\Http\Controllers\TeamInvitationAuthController;
use App\Http\Controllers\Tenant\HomeController as TenantHomeController;
use App\Http\Controllers\Webhooks\MidtransWebhookController;
use App\Models\AffiliateProfile;
use App\Models\Company;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Route;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

Route::get('/', function () {
    $affiliateBaseUrl = 'affiliate.'.env('APP_HOST', 'localhost');
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
    Route::get('/companies/login', [CompaniesAuthController::class, 'showLogin'])->name('companies.login.show');
    Route::post('/companies/login', [CompaniesAuthController::class, 'login'])->name('companies.login.store');
    Route::get('/companies/register', [CompaniesAuthController::class, 'showRegister'])->name('companies.register.show');
    Route::post('/companies/register', [CompaniesAuthController::class, 'register'])->name('companies.register.store');
    Route::get('/companies/accept-team-invitation', [CompaniesAuthController::class, 'showAcceptTeamInvitation'])->name('companies.accept-team-invitation.show');
    Route::post('/companies/accept-team-invitation', [CompaniesAuthController::class, 'acceptTeamInvitation'])->name('companies.accept-team-invitation.store');

    Route::get('/customers/login', [CustomerAuthController::class, 'showLogin'])->name('customers.login.show');
    Route::post('/customers/login', [CustomerAuthController::class, 'login'])->name('customers.login.store');
    Route::get('/customers/register', [CustomerAuthController::class, 'showRegister'])->name('customers.register.show');
    Route::post('/customers/register', [CustomerAuthController::class, 'register'])->name('customers.register.store');

    Route::get('/admin/login', [AdminAuthController::class, 'showLogin'])->name('admin.login.show');
    Route::post('/admin/login', [AdminAuthController::class, 'login'])->name('admin.login.store');
    Route::get('/team-invitation/accept', [TeamInvitationAuthController::class, 'showAccept'])->name('team-invitation.accept');
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
