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
      // Jika sedang pakai Free Trial (harga = 0)
      $isFreeTrial = $subscription->package && $subscription->package->price == 0;

      // Pengecekan Expired
      if ($subscription->status !== AgentSubscriptionStatus::ACTIVE) {
        $isSubscriptionExpired = true;
      }

      // Pengecekan Menu Marketing (Disabled jika Trial ATAU Expired)
      if ($isFreeTrial || $isSubscriptionExpired) {
        $isMarketingDisabled = true;
      }
    }

    // Membagikan variabel ke seluruh aplikasi React (Global Inertia Shared Data)
    Inertia::share('subscription_rules', [
      'isMarketingDisabled' => $isMarketingDisabled,
      'isExpired' => $isSubscriptionExpired
    ]);

    return $next($request);
  }
}
