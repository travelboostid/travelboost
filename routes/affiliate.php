<?php

use App\Http\Controllers\Affiliate\AgentController;
use App\Http\Controllers\Affiliate\BankAccountController;
use App\Http\Controllers\Affiliate\LandingController;
use App\Http\Controllers\Affiliate\NetworkController;
use App\Http\Controllers\Affiliate\PasswordController;
use App\Http\Controllers\Affiliate\PaymentController;
use App\Http\Controllers\Affiliate\ProfileController;
use App\Http\Controllers\Affiliate\WalletController;
use App\Http\Controllers\Affiliate\WalletTransactionsController;
use App\Http\Controllers\Affiliate\WithdrawalController;
use App\Http\Controllers\Auth\AffiliateAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CONFIGURATION NOTES
|--------------------------------------------------------------------------
| 1. PRODUCTION/STAGING: Aktif menggunakan $domain dari .env
| 2. LOCAL TESTING: Bisa diakses lewat localhost:8000/affiliate/...
| 3. UNIQUE NAMES: Menggunakan prefix 'affiliate.panel.' agar Wayfinder aman.
|
*/

// Ambil domain dari .env (Contoh: travelboost.co.id atau travelboost.test)
$domain = env('APP_DOMAIN', 'travelboost.co.id');

// =========================================================================
// [SECTION 1] SUBDOMAIN ROUTES (Landing Page MA/Partner)
// Prefix Name: affiliate.subdomain.
// Example: ma-satu.travelboost.co.id/
// =========================================================================
Route::domain('{subdomain}.' . $domain)->name('affiliate.subdomain.')->group(function () {
  Route::get('/', [LandingController::class, 'subdomainIndex'])->name('landing');

  Route::middleware('guest')->group(function () {
    // Register via Subdomain
    Route::get('/register', [AffiliateAuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AffiliateAuthController::class, 'register'])->name('register.store');

    // Login via Subdomain
    Route::get('/login', [AffiliateAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AffiliateAuthController::class, 'login'])->name('login.store');
  });
});

// =========================================================================
// [SECTION 2] MAIN PANEL ROUTES (travelboost.co.id/affiliate ATAU localhost:8000/affiliate)
// Prefix Name: affiliate.panel.
// =========================================================================
Route::prefix('affiliate')->name('affiliate.panel.')->group(function () {

  // Landing Page Utama (Jika diakses tanpa subdomain)
  Route::get('/', [LandingController::class, 'index'])->name('landing');

  // ---------------------------------------------------------------------
  // GUEST ROUTES
  // ---------------------------------------------------------------------
  Route::middleware('guest')->group(function () {
    Route::get('/login', [AffiliateAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AffiliateAuthController::class, 'login'])->name('login.store');

    // Local Testing (Path)
    // Route::get('/register/{referralCode?}', [AffiliateAuthController::class, 'showRegister'])->name('register');

    // Deploy (subdomain)
    Route::get('/register', [AffiliateAuthController::class, 'showRegister'])->name('register');

    Route::post('/register', [AffiliateAuthController::class, 'register'])->name('register.store');

    Route::get('/verify-notice', function () {
      return inertia('affiliate/auth/verify-notice');
    })->name('verify.notice');
  });

  // ---------------------------------------------------------------------
  // AUTHENTICATED ROUTES
  // ---------------------------------------------------------------------
  Route::middleware('auth')->group(function () {
    Route::post('/logout', [AffiliateAuthController::class, 'logout'])->name('logout');

    // Dashboard & Features (Must be Verified)
    Route::middleware('verified')->prefix('dashboard')->group(function () {

      Route::get('/', function () {
        return inertia('affiliate/dashboard/index');
      })->name('dashboard');

      // Account Setup
      Route::prefix('setup')->name('setup.')->group(function () {
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::get('/password', [PasswordController::class, 'edit'])->name('password.edit');
        Route::put('/password', [PasswordController::class, 'update'])->name('password.update');
      });

      // Network & Genealogy
      Route::prefix('network')->name('network.')->group(function () {
        Route::get('/list', [NetworkController::class, 'index'])->name('list');
        Route::get('/chart-data', [NetworkController::class, 'getChartData'])->name('chart');
        Route::get('/approvals', [NetworkController::class, 'approvals'])->name('approvals');
        Route::post('/approvals/{id}/approve', [NetworkController::class, 'approve'])->name('approve');
        Route::post('/approvals/{id}/reject', [NetworkController::class, 'reject'])->name('reject');
      });

      // Agent Management
      Route::prefix('agent')->name('agent.')->group(function () {
        Route::get('/list', [AgentController::class, 'index'])->name('list');
      });

      // Financial & Wallet (Fund)
      Route::prefix('fund')->name('fund.')->group(function () {
        Route::get('/wallet', [WalletController::class, 'index'])->name('wallet');
        Route::get('/transactions', [WalletTransactionsController::class, 'index'])->name('transactions');
        Route::get('/withdrawals', [WithdrawalController::class, 'index'])->name('withdrawals');
        Route::get('/payments', [PaymentController::class, 'index'])->name('payments');

        Route::prefix('bank-accounts')->name('bank-accounts.')->group(function () {
          Route::get('/', [BankAccountController::class, 'index'])->name('index');
          Route::post('/', [BankAccountController::class, 'store'])->name('store');
          Route::put('/{bankAccount}', [BankAccountController::class, 'update'])->name('update');
          Route::delete('/{bankAccount}', [BankAccountController::class, 'destroy'])->name('destroy');
        });
      });
    });
  });
});

/*
|--------------------------------------------------------------------------
| [OPTIONAL] LOCAL TESTING OVERRIDE
|--------------------------------------------------------------------------
*/
// Route::get('/test-landing', [LandingController::class, 'subdomainIndex']);
// Route::get('/test-register', [AffiliateAuthController::class, 'showRegister']);
