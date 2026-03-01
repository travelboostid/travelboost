<?php

use App\Http\Controllers\Me\HomeController;
use App\Http\Controllers\Me\Settings\PasswordController;
use App\Http\Controllers\Me\Settings\ProfileController;
use App\Http\Controllers\Me\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->prefix('me')->name('me.')->group(function () {
  Route::get('/', [HomeController::class, 'show'])->name('index');
  Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
  Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
  Route::middleware(['verified'])->group(function () {
    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])
      ->middleware('throttle:6,1')
      ->name('user-password.update');
    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
      ->name('two-factor.show');
  });
});
