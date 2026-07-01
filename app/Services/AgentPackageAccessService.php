<?php

namespace App\Services;

use App\Enums\CompanyType;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\AgentSubscription;
use App\Models\Company;
use App\Models\VendorAgentPartner;
use Illuminate\Database\Eloquent\Builder;

class AgentPackageAccessService
{
    public const FREE_TRIAL_PACKAGE_ID = 1;

    public function eligibleSubscriptionConstraint(Builder $query, Company $vendor): Builder
    {
        return $query
            ->whereNotNull('package_id')
            ->where(function (Builder $subscriptionQuery) use ($vendor): void {
                $subscriptionQuery->where('package_id', '!=', self::FREE_TRIAL_PACKAGE_ID);

                if ($vendor->allow_package_one_agents) {
                    $subscriptionQuery->orWhere('package_id', self::FREE_TRIAL_PACKAGE_ID);
                }
            });
    }

    public function isActivePackageOneAgent(Company $company): bool
    {
        if (($company->type->value ?? $company->type) !== CompanyType::AGENT->value) {
            return false;
        }

        $company->loadMissing('agentSubscription');

        $subscription = $company->agentSubscription;

        if (! $subscription instanceof AgentSubscription) {
            return false;
        }

        return (int) $subscription->package_id === self::FREE_TRIAL_PACKAGE_ID
            && $subscription->started_at !== null
            && $subscription->ended_at !== null
            && $subscription->ended_at->isFuture();
    }

    public function agentHasVendorAllowingPackageOneAccess(Company $agent): bool
    {
        if (! $this->isActivePackageOneAgent($agent)) {
            return true;
        }

        return VendorAgentPartner::query()
            ->where('agent_id', $agent->id)
            ->where('status', VendorAgentPartnerStatus::ACTIVE->value)
            ->whereHas('vendor', fn (Builder $vendorQuery): Builder => $vendorQuery->where('allow_package_one_agents', true))
            ->exists();
    }

    public function syncAgentSubdomainAccess(Company $agent): void
    {
        if (($agent->type->value ?? $agent->type) !== CompanyType::AGENT->value) {
            return;
        }

        $agent->loadMissing('domain');

        $domain = $agent->domain;

        if ($domain === null) {
            return;
        }

        if (! $this->isActivePackageOneAgent($agent)) {
            return;
        }

        $shouldEnableSubdomain = $this->agentHasVendorAllowingPackageOneAccess($agent)
            && filled($domain->subdomain);

        $domain->update([
            'subdomain_enabled' => $shouldEnableSubdomain,
        ]);
    }

    public function syncPackageOneAgentSubdomainAccessForVendor(Company $vendor): void
    {
        VendorAgentPartner::query()
            ->with('agent.domain', 'agent.agentSubscription')
            ->where('vendor_id', $vendor->id)
            ->where('status', VendorAgentPartnerStatus::ACTIVE->value)
            ->get()
            ->pluck('agent')
            ->filter(fn (?Company $agent): bool => $agent instanceof Company)
            ->each(fn (Company $agent) => $this->syncAgentSubdomainAccess($agent));
    }
}
