<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Http\Responses\CustomLoginResponse;
use App\Http\Responses\CustomRegisterResponse;
use App\Models\Company;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Responses\LoginResponse;
use Laravel\Fortify\Http\Responses\RegisterResponse;

class FortifyServiceProvider extends ServiceProvider
{
  /**
   * Register any application services.
   */
  public function register(): void
  {
    $this->app->singleton(LoginResponse::class, CustomLoginResponse::class);
    $this->app->singleton(RegisterResponse::class, CustomRegisterResponse::class);
  }

  /**
   * Bootstrap any application services.
   */
  public function boot(): void
  {
    Fortify::authenticateUsing(function (Request $request) {
      $validated = $request->validate([
        'intent' => ['required', 'in:login-as-agent,login-as-vendor,login-as-customer,login-as-admin'],
        'username_or_email' => ['required', 'string'],
        'password' => ['required', 'string'],
      ]);

      $usernameOrEmail = $validated['username_or_email'];
      $password = $validated['password'];

      $user = User::where(function ($q) use ($usernameOrEmail) {
        $q->where('email', $usernameOrEmail)
          ->orWhere('username', $usernameOrEmail);
      })
        ->first();
      if ($user == null) {
        return null;
      }
      if (!Hash::check($password, $user->password)) {
        return null;
      }

      return match ($validated['intent']) {
        'login-as-admin' => $this->processLoginAsAdmin($user, $request),
        'login-as-agent' => $this->processLoginAsAgent($user, $request),
        'login-as-vendor' => $this->processLoginAsVendor($user, $request),
        'login-as-customer' => $this->processLoginAsCustomer($user, $request),
        default => null,
      };
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
    $tenant = request()->attributes->get('tenant');

    Fortify::loginView(fn(Request $request) => Inertia::render('auth/login', [
      'tenant' => $tenant,
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

  private function processLoginAsAdmin(User $user, Request $request)
  {
    if (!$user->hasRole('user:admin'))
      return null;
    return $user;
  }

  private function processLoginAsAgent(User $user, Request $request)
  {
    if ($user->company_id != null) {
      return null; // Prevent login if user is not associated with a company
    }
    $company = $user->companies()->first();
    // TODO: directly create company
    if ($company == null && $user->status == UserStatus::ACTIVE) {
      return null; // Prevent login if user is not associated with any company. Please note that new users will have no company association and their status is inactive, so they will not be able to log in until they are activated by admin and associated with a company
    }
    if ($company->type != CompanyType::AGENT) {
      return null; // Prevent login if the associated company is not an agent
    }
    return $user;
  }

  private function processLoginAsVendor(User $user, Request $request)
  {
    if ($user->company_id != null) {
      return null; // Prevent login if user is not associated with a company
    }
    $company = $user->companies()->first();
    if ($company == null) {
      return null; // Prevent login if user is not associated with any company
    }
    if ($company->type != CompanyType::VENDOR) {
      return null; // Prevent login if the associated company is not a vendor
    }
    return $user;
  }

  private function processLoginAsCustomer(User $user, Request $request)
  {
    if ($user->company_id == null) {
      return null; // Prevent login if user is not associated with a company
    }
    $domain = Context::get('domain');
    if ($domain == null) {
      return null; // Prevent login if tenant is not present, as customers should not be able to log in to tenant context
    }
    if ($domain->owner instanceof Company == false) {
      return null; // Prevent login if not login under company tenant context
    }
    if ($user->company_id != $domain->owner->id) {
      return null; // Prevent login if user is not the customer associated with the current domain
    }
    return $user;
  }
}
