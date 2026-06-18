<?php

namespace App\Support;

use App\Enums\AdPlatform;
use RuntimeException;

final class MarketingFeatures
{
    public static function googleAdsEnabled(): bool
    {
        return (bool) config('travelboost.marketing.google_ads_enabled', false);
    }

    public static function metaAdsEnabled(): bool
    {
        return (bool) config('travelboost.marketing.meta_ads_enabled', false);
    }

    public static function adCampaignsEnabled(): bool
    {
        return self::googleAdsEnabled() || self::metaAdsEnabled();
    }

    public static function isPlatformEnabled(AdPlatform $platform): bool
    {
        return match ($platform) {
            AdPlatform::Google => self::googleAdsEnabled(),
            AdPlatform::Meta => self::metaAdsEnabled(),
            default => false,
        };
    }

    public static function assertPlatformEnabled(AdPlatform $platform): void
    {
        if (! self::isPlatformEnabled($platform)) {
            throw new RuntimeException('This ad platform is not available yet.');
        }
    }

    /**
     * @return array{google_ads: bool, meta_ads: bool, ad_campaigns: bool}
     */
    public static function toArray(): array
    {
        return [
            'google_ads' => self::googleAdsEnabled(),
            'meta_ads' => self::metaAdsEnabled(),
            'ad_campaigns' => self::adCampaignsEnabled(),
        ];
    }
}
