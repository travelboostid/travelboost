<?php

use App\Support\MarketingPages;

it('identifies marketing page components', function () {
    expect(MarketingPages::isMarketingComponent('home/index'))->toBeTrue();
    expect(MarketingPages::isMarketingComponent('companies/dashboard/index'))->toBeFalse();
});

it('returns hero preload hints only for the home page', function () {
    expect(MarketingPages::preloadHints('home/index'))->toBe([
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
    ]);

    expect(MarketingPages::preloadHints('pricing/index'))->toBe([]);
});

it('exposes marketing page components used by the public site', function () {
    expect(MarketingPages::COMPONENTS)->toContain('home/index', 'pricing/index');
});
