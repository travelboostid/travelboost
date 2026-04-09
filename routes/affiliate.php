<?php

use App\Http\Controllers\Affiliate\LandingController;
use App\Http\Controllers\Auth\AffiliateAuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Affiliate\ProfileController;

Route::prefix('affiliate')->name('affiliate.')->group(function () {

  // Landing Page
  Route::get('/', [LandingController::class, 'index'])->name('landing');

  // Guest Auth
  Route::middleware('guest')->group(function () {
    Route::get('/register', [AffiliateAuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AffiliateAuthController::class, 'register'])->name('register.store');

    Route::get('/login', [AffiliateAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AffiliateAuthController::class, 'login'])->name('login.store');
  });

  // Auth Dashboard
  Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
      return inertia('affiliate/dashboard/index');
    })->name('dashboard');

    // --- Rute Profil Pribadi ---
    Route::get('/dashboard/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/dashboard/profile', [ProfileController::class, 'update'])->name('profile.update');
  });
});
