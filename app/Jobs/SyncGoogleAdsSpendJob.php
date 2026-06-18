<?php

namespace App\Jobs;

use App\Enums\AdCampaignStatus;
use App\Enums\AdPlatformConnectionStatus;
use App\Models\Company;
use App\Services\GoogleAdsService;
use App\Support\MarketingFeatures;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncGoogleAdsSpendJob implements ShouldQueue
{
    use Queueable;

    public function handle(GoogleAdsService $googleAdsService): void
    {
        if (! MarketingFeatures::googleAdsEnabled() || ! $googleAdsService->isConfigured()) {
            return;
        }

        Company::query()
            ->whereHas('googleAdsConnection', function ($query): void {
                $query->where('status', AdPlatformConnectionStatus::Connected->value)
                    ->whereNotNull('external_account_id');
            })
            ->whereHas('adCampaigns', function ($query): void {
                $query->where('status', AdCampaignStatus::Active->value);
            })
            ->lazyById()
            ->each(function (Company $company) use ($googleAdsService): void {
                $googleAdsService->syncSpendForCompany($company);
            });
    }
}
