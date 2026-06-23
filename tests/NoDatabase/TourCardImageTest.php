<?php

use App\Support\TourCatalogPreload;

it('caps tour card srcset width at medium variant', function () {
    $media = [
        'data' => [
            'files' => [
                ['code' => 'large', 'url' => 'https://cdn.example/large.webp', 'width' => 1080],
                ['code' => 'medium', 'url' => 'https://cdn.example/medium.webp', 'width' => 720],
                ['code' => 'small', 'url' => 'https://cdn.example/small.webp', 'width' => 480],
            ],
        ],
    ];

    $url = TourCatalogPreload::resolveMediumImageUrl($media['data']);

    expect($url)->toBe('https://cdn.example/medium.webp');
});

it('prefers medium variant for tour catalog preload hints', function () {
    $mediaData = [
        'files' => [
            ['code' => 'large', 'url' => 'https://cdn.example/large.webp', 'width' => 1080],
            ['code' => 'medium', 'url' => 'https://cdn.example/medium.webp', 'width' => 720],
        ],
    ];

    expect(TourCatalogPreload::preloadHints(
        TourCatalogPreload::resolveMediumImageUrl($mediaData),
    )[0]['href'])->toBe('https://cdn.example/medium.webp');
});
