<?php

namespace App\Http\Middleware;

use App\Models\AnonymousUser;
use App\Models\Currency;
use App\Models\AgentSubscription;
use App\Enums\AgentSubscriptionStatus;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;

class HandleInertiaRequests extends Middleware
{
  protected $rootView = 'app';

  public function version(Request $request): ?string
  {
    return parent::version($request);
  }

  public function share(Request $request): array
  {
    $company = $request->route('company');
    $anonymousUserToken = $request->cookie('anonymous_user_token');
    $anonymousUser = $anonymousUserToken ? AnonymousUser::where('token', $anonymousUserToken)->first() : null;

    if (!$anonymousUser && !$request->user()) {
      $anonymousUser = AnonymousUser::create([
        'token' => Str::uuid()->toString(),
      ]);
      Cookie::queue('anonymous_user_token', $anonymousUser->token, 60 * 24 * 365);
    }

    $isMarketingDisabled = false;
    $isSubscriptionExpired = false;

    if ($company && isset($company->id)) {
      $subscription = AgentSubscription::with('package')
        ->where('company_id', $company->id)
        ->latest()
        ->first();

      if (!$subscription) {
        $isSubscriptionExpired = true;
      } else {
        $isFreeTrial = $subscription->package && $subscription->package->price <= 0;

        if ($subscription->status !== AgentSubscriptionStatus::ACTIVE) {
          $isSubscriptionExpired = true;
        }

        if ($isFreeTrial || $isSubscriptionExpired) {
          $isMarketingDisabled = true;
        }
      }
    }

    return [
      ...parent::share($request),
      'name' => config('app.name'),
      'appDomain' => env('APP_HOST', 'localhost'),
      'auth' => [
        'user' => $request->user()?->load(['companies']),
        'permissions' => $request->user()?->allPermissions()->pluck('name')->toArray(),
        'roles' => $request->user()?->roles->pluck('name')->toArray(),
        'teams' => $request->user()?->allTeams()->pluck('name')->toArray(),
      ],
      'company' => $company,
      'tenant' => $request->attributes->get('tenant'),
      'anonymousUser' => $anonymousUser,
      'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
      'flash' => [
        'tab' => $request->session()->get('tab'),
        'account_inactive' => $request->session()->get('account_inactive'),
        'warning' => $request->session()->get('warning'),
        'success' => $request->session()->get('success'),
      ],
      'subscription_rules' => [
        'isMarketingDisabled' => $isMarketingDisabled,
        'isExpired' => $isSubscriptionExpired
      ],
    ];
  }
}
