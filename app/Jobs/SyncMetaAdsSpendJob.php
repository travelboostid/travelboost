<?php

namespace App\Jobs;

use App\Enums\AdCampaignStatus;
use App\Enums\AdPlatformConnectionStatus;
use App\Models\Company;
use App\Services\MetaAdsService;
use App\Support\MarketingFeatures;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncMetaAdsSpendJob implements ShouldQueue
{
    use Queueable;

    public function handle(MetaAdsService $metaAdsService): void
    {
        if (! MarketingFeatures::metaAdsEnabled() || ! $metaAdsService->isConfigured()) {
            return;
        }

        Company::query()
            ->whereHas('metaAdsConnection', function ($query): void {
                $query->where('status', AdPlatformConnectionStatus::Connected->value)
                    ->whereNotNull('external_account_id');
            })
            ->whereHas('adCampaigns', function ($query): void {
                $query->where('status', AdCampaignStatus::Active->value);
            })
            ->lazyById()
            ->each(function (Company $company) use ($metaAdsService): void {
                $metaAdsService->syncSpendForCompany($company);
            });
    }
}
