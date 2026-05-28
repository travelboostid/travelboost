<?php

namespace App\Http\Middleware;

use App\Enums\CompanyType;
use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class UseCurrentCompanyProps
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        /** @var Company | null */
        $company = $request->route('company');

        if ($company == null) {
            return $next($request);
        }

        $company->loadMissing(['settings']);

        $isMarketingDisabled = false;
        $isSubscriptionExpired = false;

        $isAgent = $company->type == CompanyType::AGENT;
        if ($isAgent) {
            $subscription = $isAgent ? $company->agentSubscription : null;
            $isSubscriptionExpired = ! $subscription || $subscription->ended_at < now();
            $isFreeTrial = ($subscription->package?->price ?? 0) <= 0;
            $isMarketingDisabled = $isFreeTrial || $isSubscriptionExpired;
        }

        Inertia::share([
            'company' => $company,
            'subscriptionRules' => [
                'isMarketingDisabled' => $isMarketingDisabled,
                'isExpired' => $isSubscriptionExpired,
            ],
        ]);

        return $next($request);
    }
}
