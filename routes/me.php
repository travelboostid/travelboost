<?php

use App\Http\Controllers\Me\HomeController;
use App\Http\Controllers\Me\OnboardingController;
use App\Http\Controllers\Me\Settings\PasswordController;
use App\Http\Controllers\Me\Settings\ProfileController;
use App\Http\Controllers\Me\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Me\TeamInvitationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'check.user.status'])->prefix('me')->name('me.')->group(function () {
  Route::get('/onboarding', [OnboardingController::class, 'index'])->name('onboarding');
  Route::post('/onboarding/create-company', [OnboardingController::class, 'createCompany'])->name('onboarding.create-company');
  Route::post('/onboarding/accept-invitation/{invitation}', [OnboardingController::class, 'acceptInvitation'])->name('onboarding.accept-invitation');
  Route::post('/onboarding/decline-invitations', [OnboardingController::class, 'declineInvitations'])->name('onboarding.decline-invitations');
  Route::get('/', [HomeController::class, 'show'])->name('index');
  Route::get('/team-invitations/accept/{code}', [TeamInvitationController::class, 'acceptInvitation'])->name('team-invitations.accept');
  Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
  Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
  Route::middleware(['verified'])->group(function () {
    Route::get('password', [PasswordController::class, 'edit'])->name('user-password.edit');
    Route::put('password', [PasswordController::class, 'update'])
      ->middleware('throttle:6,1')
      ->name('user-password.update');
    Route::get('two-factor', [TwoFactorAuthenticationController::class, 'show'])
      ->name('two-factor.show');
  });
});
