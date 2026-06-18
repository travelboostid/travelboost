<?php

namespace App\Http\Middleware;

use App\Enums\CompanyType;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\BookingActionRequest;
use App\Models\Company;
use App\Models\VendorAgentPartner;
use App\Support\MarketingFeatures;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        /** @var Company|string|null $company */
        $company = $request->route('company');

        if ($company == null) {
            return $next($request);
        }

        if (is_string($company)) {
            $company = Company::query()
                ->where('username', $company)
                ->firstOrFail();

            $request->route()?->setParameter('company', $company);
        }

        $company->loadMissing(['settings']);

        $isMarketingDisabled = false;
        $isSubscriptionExpired = false;

        $isAgent = $company->type == CompanyType::AGENT;
        if ($isAgent) {
            $subscription = $isAgent ? $company->agentSubscription : null;
            $isSubscriptionExpired = ! $subscription || $subscription->ended_at < now();
            $isFreeTrial = ($subscription?->package?->price ?? 0) <= 0;
            $isMarketingDisabled = $isFreeTrial || $isSubscriptionExpired;
        }

        Inertia::share([
            'company' => $company,
            'agentWhatsappVendors' => fn (): array => $this->agentWhatsappVendors($company),
            'subscriptionRules' => [
                'isMarketingDisabled' => $isMarketingDisabled,
                'isExpired' => $isSubscriptionExpired,
            ],
            'marketingFeatures' => MarketingFeatures::toArray(),
            'bookingModificationRequestCounts' => fn (): array => $this->bookingModificationRequestCounts($company),
        ]);

        return $next($request);
    }

    /**
     * @return array{cancellations: int, refunds: int, reschedules: int, restores: int, total: int}
     */
    private function bookingModificationRequestCounts(Company $company): array
    {
        $emptyCounts = [
            'cancellations' => 0,
            'refunds' => 0,
            'reschedules' => 0,
            'restores' => 0,
            'total' => 0,
        ];

        if ($company->type !== CompanyType::VENDOR) {
            return $emptyCounts;
        }

        $countsByAction = BookingActionRequest::query()
            ->select('target_action', DB::raw('count(*) as aggregate'))
            ->where('status', 'pending')
            ->whereHas('booking', fn ($query) => $query->where('vendor_id', $company->id))
            ->groupBy('target_action')
            ->pluck('aggregate', 'target_action');

        $counts = [
            'cancellations' => (int) ($countsByAction['cancel'] ?? 0),
            'refunds' => (int) ($countsByAction['refund'] ?? 0),
            'reschedules' => (int) ($countsByAction['reschedule'] ?? 0),
            'restores' => (int) ($countsByAction['restore'] ?? 0),
        ];

        return [
            ...$counts,
            'total' => array_sum($counts),
        ];
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
