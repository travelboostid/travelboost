<?php

use App\Http\Controllers\Affiliate\LandingController;
use App\Http\Controllers\Auth\AffiliateAuthController;
use App\Http\Controllers\Affiliate\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Affiliate\PasswordController;
use App\Http\Controllers\Affiliate\NetworkController;
use App\Http\Controllers\Affiliate\AgentController;
use App\Http\Controllers\Affiliate\WalletController;
use App\Http\Controllers\Affiliate\WalletTransactionsController;
use App\Http\Controllers\Affiliate\WithdrawalController;
use App\Http\Controllers\Affiliate\BankAccountController;
use App\Http\Controllers\Affiliate\PaymentController;

/*
|--------------------------------------------------------------------------
| 👋 HEELLLOOOOOOOO NOTE YAAA UNTUK PAGE AFFILIATE INI
|--------------------------------------------------------------------------
| 
| 🚀 NOTE GUYSSSSSS:
| 1. Buka (uncomment) blok "A. VERSI PRODUCTION (SUBDOMAIN ASLI)" di bawah.
| 2. Tutup (comment) 2 baris route registrasi di blok "B. VERSI LOKAL / TESTING" 
|    (udah aku tandain pakai ikon 🛑 ini ya).
| 3. Pastikan settingan wildcard subdomain (*.domain.com) di VPS/Hosting udah nyala.
|    tapi kalau ga memungkinkan pakai wildcard, cara lainnya mungkin harus buat 
|    subdomain manual untuk testing (misal: ma-satu.travelboost.co.id).
|
*/

// =========================================================================
// A. VERSI PRODUCTION (SUBDOMAIN ASLI)
// =========================================================================
/*
$domain = env('APP_DOMAIN', 'travelboost.test');

Route::domain('{subdomain}.' . $domain)->name('subdomain.')->group(function () {
    Route::get('/', [LandingController::class, 'subdomainIndex'])->name('landing');
    
    Route::middleware('guest')->group(function () {
        Route::get('/register', [AffiliateAuthController::class, 'showRegister'])->name('register');
        Route::post('/register', [AffiliateAuthController::class, 'register'])->name('register.store');
    });
});
*/


// =========================================================================
// B. MAIN ROUTE & VERSI LOKAL / TESTING
// =========================================================================

Route::prefix('affiliate')->name('affiliate.')->group(function () {

  // Landing Page Umum MA (Promosi ke calon Affiliator)
  Route::get('/', [LandingController::class, 'index'])->name('landing');

  // ---------------------------------------------------------------------
  // GUEST (Belum Login)
  // ---------------------------------------------------------------------
  Route::middleware('guest')->group(function () {
    Route::get('/login', [AffiliateAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AffiliateAuthController::class, 'login'])->name('login.store');

    // 🛑 MATIKAN 2 ROUTE INI SAAT DI DEPLOY! (Hanya untuk testing lokal)
    Route::get('/register/{subdomain?}', [AffiliateAuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AffiliateAuthController::class, 'register'])->name('register.store');
    // ------------------------------------------------------------------

    Route::get('/verify-notice', function () {
      return inertia('affiliate/auth/verify-notice');
    })->name('verify.notice');
  });

  // ---------------------------------------------------------------------
  // AUTH (Wajib Login)
  // ---------------------------------------------------------------------
  Route::middleware('auth')->group(function () {

    Route::post('/logout', [AffiliateAuthController::class, 'logout'])->name('logout');

    // -----------------------------------------------------------------
    // WAJIB VERIFIKASI EMAIL
    // -----------------------------------------------------------------
    Route::middleware('verified')->prefix('dashboard')->group(function () {

      // Dashboard Utama
      Route::get('/', function () {
        return inertia('affiliate/dashboard/index');
      })->name('dashboard');

      // Setup (Profile & Password)
      Route::prefix('setup')->group(function () {
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');

        Route::get('/password', [PasswordController::class, 'edit'])->name('password.edit');
        Route::put('/password', [PasswordController::class, 'update'])->name('password.update');
      });

      // Manajemen Jaringan (Khusus MA / Partner)
      Route::prefix('affiliate')->name('affiliate.')->group(function () {
        Route::get('/list', [NetworkController::class, 'index'])->name('list');
        Route::get('/chart-data', [NetworkController::class, 'getChartData'])->name('chart');
        Route::get('/approvals', [NetworkController::class, 'approvals'])->name('approvals');
        Route::post('/approvals/{id}/approve', [NetworkController::class, 'approve'])->name('approve');
        Route::post('/approvals/{id}/reject', [NetworkController::class, 'reject'])->name('reject');
      });

      // Daftar Agen
      Route::prefix('agent')->name('agent.')->group(function () {
        Route::get('/list', [AgentController::class, 'index'])->name('list');
      });

      // Dompet & Keuangan (Fund)
      Route::prefix('fund')->name('fund.')->group(function () {
        Route::get('/wallet', [WalletController::class, 'index'])->name('wallet');
        Route::get('/transactions', [WalletTransactionsController::class, 'index'])->name('transactions');
        Route::get('/withdrawals', [WithdrawalController::class, 'index'])->name('withdrawals');
        Route::get('/payments', [PaymentController::class, 'index'])->name('payments');

        // Bank Accounts
        Route::get('/bank-accounts', [BankAccountController::class, 'index'])->name('bank-accounts');
        Route::post('/bank-accounts', [BankAccountController::class, 'store'])->name('bank-accounts.store');
        Route::put('/bank-accounts/{bankAccount}', [BankAccountController::class, 'update'])->name('bank-accounts.update');
        Route::delete('/bank-accounts/{bankAccount}', [BankAccountController::class, 'destroy'])->name('bank-accounts.destroy');
      });
    }); // End of Verified Middleware
  }); // End of Auth Middleware
});
