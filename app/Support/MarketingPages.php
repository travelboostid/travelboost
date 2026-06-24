<?php

namespace App\Support;

class MarketingPages
{
    /**
     * Inertia page components that use the public marketing layout.
     *
     * @var list<string>
     */
    public const COMPONENTS = [
        'home/index',
        'about/index',
        'contact/index',
        'learn-more/index',
        'pricing/index',
        'privacy/index',
        'terms-and-conditions/index',
        'cookie-policy/index',
    ];

    public static function isMarketingComponent(?string $component): bool
    {
        return $component !== null && in_array($component, self::COMPONENTS, true);
    }

    /**
     * @return list<array{href: string, as: string, type?: string}>
     */
    public static function preloadHints(?string $component): array
    {
        if ($component !== 'home/index') {
            return [];
        }

        return [
            [
                'href' => '/images/hero-travel.webp',
                'as' => 'image',
                'type' => 'image/webp',
            ],
            [
                'href' => '/images/hero-travel.jpg',
                'as' => 'image',
                'type' => 'image/jpeg',
            ],
        ];
    }
}
