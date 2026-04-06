<?php

use App\Console\Commands\ProcessAiBilling;
use App\Http\Middleware\CheckOnboarding;
use App\Http\Middleware\CheckUserStatus;
use App\Http\Middleware\EnsureAgentSubscriptionIsActive;
use App\Http\Middleware\EnsureHasAdminAccess;
use App\Http\Middleware\EnsureHasCompanyAccess;
use App\Http\Middleware\TenantResolver;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
  ->withRouting(
    web: __DIR__ . '/../routes/web.php',
    commands: __DIR__ . '/../routes/console.php',
    channels: __DIR__ . '/../routes/channels.php',
    health: '/up',
  )
  ->withMiddleware(function (Middleware $middleware): void {
    $middleware->validateCsrfTokens(except: [
      'webhooks/*',
    ]);
  })
  ->withMiddleware(function (Middleware $middleware): void {
    $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
    $middleware->alias([
      'company.access' => EnsureHasCompanyAccess::class,
      'admin.access' => EnsureHasAdminAccess::class,
      'agent.subscription.active' => EnsureAgentSubscriptionIsActive::class,
      'check.user.status' => CheckUserStatus::class,
    ]);
    $middleware->web(append: [
      TenantResolver::class,
      HandleAppearance::class,
      HandleInertiaRequests::class,
      AddLinkHeadersForPreloadedAssets::class,
    ]);
  })
  ->withSchedule(function (Schedule $schedule) {
    $schedule->command(ProcessAiBilling::class)->dailyAt('00:05');
  })
  ->withExceptions(function (Exceptions $exceptions): void {
    //
  })->create();
