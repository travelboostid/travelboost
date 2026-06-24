<?php

namespace App\Support;

class PerformanceHints
{
    /**
     * @return list<array{href: string, as: string, type?: string}>
     */
    public static function forInertiaPage(
        ?string $component,
        ?string $tenantLandingPageData = null,
        ?string $lcpImageUrl = null,
    ): array {
        $hints = MarketingPages::preloadHints($component);

        if ($component === 'companies/landing-page') {
            $hints = array_merge(
                $hints,
                TenantLandingPreload::preloadHintsFromLandingData($tenantLandingPageData),
            );
        }

        if (in_array($component, TourCatalogPreload::PAGE_COMPONENTS, true)) {
            $hints = array_merge(
                $hints,
                TourCatalogPreload::preloadHints($lcpImageUrl),
            );
        }

        return $hints;
    }
}
