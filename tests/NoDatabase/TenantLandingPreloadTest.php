<?php

use App\Support\PerformanceHints;
use App\Support\TenantLandingPreload;

it('resolves legacy puck image urls', function () {
    expect(TenantLandingPreload::resolveImageUrl('/images/foo.jpg'))
        ->toBe('/images/foo.jpg');
});

it('resolves serialized puck image payloads', function () {
    $payload = json_encode([
        'mediaId' => 'media-1',
        'src' => '/storage/images/large_foo.webp',
        'srcSet' => '/storage/images/small_foo.webp 480w, /storage/images/large_foo.webp 1080w',
    ]);

    expect(TenantLandingPreload::resolveImageUrl($payload))
        ->toBe('/storage/images/large_foo.webp');
});

it('extracts hero image url from landing page data', function () {
    $landingPageData = json_encode([
        'content' => [
            [
                'type' => 'Features',
                'props' => [],
            ],
            [
                'type' => 'Hero3',
                'props' => [
                    'backgroundUrl' => json_encode([
                        'mediaId' => 'media-hero',
                        'src' => '/storage/images/large_hero.webp',
                        'srcSet' => '/storage/images/small_hero.webp 480w',
                    ]),
                ],
            ],
        ],
    ]);

    expect(TenantLandingPreload::resolveHeroImageUrl($landingPageData))
        ->toBe('/storage/images/large_hero.webp');
});

it('builds preload hints for tenant hero webp images', function () {
    $landingPageData = json_encode([
        'content' => [
            [
                'type' => 'Hero1',
                'props' => [
                    'imageUrl' => '/storage/images/large_hero.webp',
                ],
            ],
        ],
    ]);

    expect(TenantLandingPreload::preloadHintsFromLandingData($landingPageData))
        ->toBe([
            [
                'href' => '/storage/images/large_hero.webp',
                'as' => 'image',
                'type' => 'image/webp',
            ],
        ]);
});

it('merges marketing and tenant preload hints for company landing page', function () {
    $landingPageData = json_encode([
        'content' => [
            [
                'type' => 'Hero6',
                'props' => [
                    'backgroundUrl' => '/storage/images/tenant-hero.webp',
                ],
            ],
        ],
    ]);

    $hints = PerformanceHints::forInertiaPage('companies/landing-page', $landingPageData);

    expect($hints[0]['href'])->toBe('/storage/images/tenant-hero.webp');
});
