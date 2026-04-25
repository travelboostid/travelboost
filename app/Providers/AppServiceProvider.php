<?php

namespace App\Providers;

use App\Models\AgentSubscriptionPayment;
use App\Models\WalletTopupPayment;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class AppServiceProvider extends ServiceProvider
{
  /**
   * Register any application services.
   */
  public function register(): void
  {
    $this->app->singleton(ImageManager::class, function () {
      return new ImageManager(new Driver());
    });
  }

  /**
   * Bootstrap any application services.
   */
  public function boot(): void
  {
    Relation::morphMap([
      'wallet-topup-payment' => WalletTopupPayment::class,
      'agent-subscription-payment' => AgentSubscriptionPayment::class,
      'company' => \App\Models\Company::class,
      'user' => \App\Models\User::class,
      'anonymous-user' => \App\Models\AnonymousUser::class,
      'affiliator' => \App\Models\AffiliateProfile::class,
    ]);
    Authenticate::redirectUsing(function ($request) {
      if ($request->expectsJson()) {
        return null; // → 401 (important for API/Inertia)
      }

      $redirectPath = '/'; // Default redirect path
      $domain = Context::get('domain');
      if ($domain == null) {
        $redirectPath = route('agent.login');
      } else if ($domain->owner instanceof \App\Models\Company) {
        $redirectPath = route('customer.login');
      } else if ($domain->owner instanceof \App\Models\AffiliateProfile) {
        $redirectPath = '/affiliate/login';
      } else {
        $redirectPath = '/'; // Fallback to general login if domain owner type is unrecognized
      }
      return $redirectPath;
    });

    $this->configureDefaults();
  }

  /**
   * Configure default behaviors for production-ready applications.
   */
  protected function configureDefaults(): void
  {
    Date::use(CarbonImmutable::class);

    DB::prohibitDestructiveCommands(
      app()->isProduction(),
    );

    Password::defaults(
      fn(): ?Password => app()->isProduction()
        ? Password::min(12)
        ->mixedCase()
        ->letters()
        ->numbers()
        ->symbols()
        ->uncompromised()
        : null
    );
  }
}
