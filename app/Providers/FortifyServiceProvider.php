<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Models\Company;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
  /**
   * Register any application services.
   */
  public function register(): void
  {
    //
  }

  /**
   * Bootstrap any application services.
   */
  public function boot(): void
  {
    Fortify::authenticateUsing(function (Request $request) {
      $validated = $request->validate([
        'username_or_email' => ['required', 'string'],
        'password' => ['required', 'string'],
      ]);

      $tenant = $request->attributes->get('tenant');
      Log::info("Attempting authentication for username/email", ['x' => $tenant]);

      $usernameOrEmail = $validated['username_or_email'];

      $query = User::where(function ($q) use ($usernameOrEmail) {
        $q->where('email', $usernameOrEmail)
          ->orWhere('username', $usernameOrEmail);
      });

      if ($tenant != null) {
        $query->where('company_id', $tenant->id);
      } else {
        $query->whereNull('company_id');
      }

      $user = $query->first();

      if ($user && Hash::check($validated['password'], $user->password)) {
        return $user;
      }

      return null;
    });
    $this->configureActions();
    $this->configureViews();
    $this->configureRateLimiting();
  }

  /**
   * Configure Fortify actions.
   */
  private function configureActions(): void
  {
    Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
    Fortify::createUsersUsing(CreateNewUser::class);
  }

  /**
   * Configure Fortify views.
   */
  private function configureViews(): void
  {
    Fortify::loginView(fn(Request $request) => Inertia::render('auth/login', [
      'company' => null,
      'canResetPassword' => Features::enabled(Features::resetPasswords()),
      'canRegister' => Features::enabled(Features::registration()),
      'status' => $request->session()->get('status')
    ]));

    Fortify::resetPasswordView(fn(Request $request) => Inertia::render('auth/reset-password', [
      'email' => $request->email,
      'token' => $request->route('token'),
    ]));

    Fortify::requestPasswordResetLinkView(fn(Request $request) => Inertia::render('auth/forgot-password', [
      'status' => $request->session()->get('status'),
    ]));

    Fortify::verifyEmailView(fn(Request $request) => Inertia::render('auth/verify-email', [
      'status' => $request->session()->get('status'),
    ]));

    Fortify::registerView(fn() => Inertia::render('auth/register'));

    Fortify::twoFactorChallengeView(fn() => Inertia::render('auth/two-factor-challenge'));

    Fortify::confirmPasswordView(fn() => Inertia::render('auth/confirm-password'));
  }

  /**
   * Configure rate limiting.
   */
  private function configureRateLimiting(): void
  {
    RateLimiter::for('two-factor', function (Request $request) {
      return Limit::perMinute(5)->by($request->session()->get('login.id'));
    });

    RateLimiter::for('login', function (Request $request) {
      $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())) . '|' . $request->ip());

      return Limit::perMinute(5)->by($throttleKey);
    });
  }
}
