<?php

namespace App\Http\Middleware;

use App\Enums\AgentSubscriptionStatus;
use App\Models\AgentSubscription;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureAgentSubscriptionIsActive
{
  public function handle(Request $request, Closure $next): Response
  {
    $company = $request->route('company');
    $subscription = AgentSubscription::where('company_id', $company->id)->latest()->first();

    $isMarketingDisabled = false;
    $isSubscriptionExpired = false;

    if (!$subscription) {
      $isSubscriptionExpired = true;
    } else {
      $isFreeTrial = $subscription->package && $subscription->package->price == 0;

      if ($subscription->status !== AgentSubscriptionStatus::ACTIVE) {
        $isSubscriptionExpired = true;
      }

      if ($isFreeTrial || $isSubscriptionExpired) {
        $isMarketingDisabled = true;
      }
    }

    Inertia::share('subscription_rules', [
      'isMarketingDisabled' => $isMarketingDisabled,
      'isExpired' => $isSubscriptionExpired
    ]);

    return $next($request);
  }
}
