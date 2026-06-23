<?php

use App\Support\MediaCdn;
use App\Support\PerformanceHints;
use App\Support\TourCatalogPreload;

it('resolves medium image url from media files', function () {
    $mediaData = [
        'files' => [
            ['code' => 'large', 'url' => 'https://cdn.example/large.webp', 'width' => 1080],
            ['code' => 'medium', 'url' => 'https://cdn.example/medium.webp', 'width' => 720],
            ['code' => 'small', 'url' => 'https://cdn.example/small.webp', 'width' => 480],
        ],
    ];

    expect(TourCatalogPreload::resolveMediumImageUrl($mediaData))
        ->toBe('https://cdn.example/medium.webp');
});

it('falls back to small when medium is missing', function () {
    $mediaData = [
        'files' => [
            ['code' => 'large', 'url' => 'https://cdn.example/large.webp', 'width' => 1080],
            ['code' => 'small', 'url' => 'https://cdn.example/small.webp', 'width' => 480],
        ],
    ];

    expect(TourCatalogPreload::resolveMediumImageUrl($mediaData))
        ->toBe('https://cdn.example/small.webp');
});

it('builds preload hints for tour catalog lcp image', function () {
    expect(TourCatalogPreload::preloadHints('https://cdn.example/medium.webp'))
        ->toBe([
            [
                'href' => 'https://cdn.example/medium.webp',
                'as' => 'image',
                'type' => 'image/webp',
            ],
        ]);
});

it('resolves first tour image url from direct tour models', function () {
    $tours = [
        (object) [
            'image' => [
                'data' => [
                    'files' => [
                        ['code' => 'medium', 'url' => 'https://cdn.example/catalog-medium.webp', 'width' => 720],
                    ],
                ],
            ],
        ],
    ];

    expect(TourCatalogPreload::resolveFirstTourImageUrl($tours))
        ->toBe('https://cdn.example/catalog-medium.webp');
});

it('merges tour catalog preload hints for vendor dashboard page', function () {
    $hints = PerformanceHints::forInertiaPage(
        'companies/dashboard/vendor-tours/index',
        null,
        'https://cdn.example/medium.webp',
    );

    expect($hints[0]['href'])->toBe('https://cdn.example/medium.webp');
});

it('resolves media cdn preconnect origin from filesystem config', function () {
    config()->set('filesystems.disks.public.url', 'https://nos.wjv-1.neo.id/tb-media-dev');

    expect(MediaCdn::preconnectOrigin())->toBe('https://nos.wjv-1.neo.id');
});

it('returns null preconnect origin when media url is missing', function () {
    config()->set('filesystems.disks.public.url', null);
    config()->set('filesystems.disks.s3.url', null);

    expect(MediaCdn::preconnectOrigin())->toBeNull();
});
