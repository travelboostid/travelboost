<?php

namespace App\Http\Middleware;

use App\Enums\CompanyType;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\Company;
use App\Models\VendorAgentPartner;
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
            'agentWhatsappVendors' => fn (): array => $this->agentWhatsappVendors($company),
            'subscriptionRules' => [
                'isMarketingDisabled' => $isMarketingDisabled,
                'isExpired' => $isSubscriptionExpired,
            ],
        ]);

        return $next($request);
    }

    /**
     * @return list<array{name: string, username: string, phone: string|null}>
     */
    private function agentWhatsappVendors(Company $company): array
    {
        if ($company->type !== CompanyType::AGENT) {
            return [];
        }

        return VendorAgentPartner::query()
            ->where('agent_id', $company->id)
            ->where('status', VendorAgentPartnerStatus::ACTIVE)
            ->with('vendor:id,name,username,phone,customer_service_phone')
            ->get()
            ->map(fn (VendorAgentPartner $partner): ?array => $partner->vendor ? [
                'name' => $partner->vendor->name,
                'username' => $partner->vendor->username,
                'phone' => $partner->vendor->customer_service_phone ?: $partner->vendor->phone,
            ] : null)
            ->filter()
            ->values()
            ->all();
    }
}
