<?php

namespace App\Providers;

use App\Models\AgentSubscriptionPayment;
use App\Models\WalletTopupPayment;
use App\Services\ChatbotService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Relations\Relation;
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
    ]);

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
