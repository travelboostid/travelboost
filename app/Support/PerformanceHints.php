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
    ): array {
        $hints = MarketingPages::preloadHints($component);

        if ($component === 'companies/landing-page') {
            $hints = array_merge(
                $hints,
                TenantLandingPreload::preloadHintsFromLandingData($tenantLandingPageData),
            );
        }

        return $hints;
    }
}
