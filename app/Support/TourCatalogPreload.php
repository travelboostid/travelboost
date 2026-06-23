<?php

namespace App\Support;

class TourCatalogPreload
{
    /**
     * Inertia pages that render tour catalog cards.
     *
     * @var list<string>
     */
    public const PAGE_COMPONENTS = [
        'companies/agent-tours',
        'companies/dashboard/vendor-tours/index',
    ];

    /**
     * @param  iterable<mixed>  $items
     */
    public static function resolveFirstTourImageUrl(iterable $items): ?string
    {
        foreach ($items as $item) {
            $imageData = data_get($item, 'tour.image.data') ?? data_get($item, 'image.data');

            if (! is_array($imageData)) {
                continue;
            }

            $url = self::resolveMediumImageUrl($imageData);

            if ($url !== null) {
                return $url;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $mediaData
     */
    public static function resolveMediumImageUrl(array $mediaData): ?string
    {
        $files = $mediaData['files'] ?? [];

        if (! is_array($files)) {
            return null;
        }

        foreach (['medium', 'small', 'large', 'original'] as $variant) {
            foreach ($files as $file) {
                if (! is_array($file)) {
                    continue;
                }

                if (($file['code'] ?? null) === $variant && is_string($file['url'] ?? null) && $file['url'] !== '') {
                    return $file['url'];
                }
            }
        }

        return null;
    }

    /**
     * @return list<array{href: string, as: string, type?: string}>
     */
    public static function preloadHints(?string $imageUrl): array
    {
        if ($imageUrl === null || $imageUrl === '') {
            return [];
        }

        return [
            [
                'href' => $imageUrl,
                'as' => 'image',
                'type' => str_ends_with(strtolower($imageUrl), '.webp') ? 'image/webp' : 'image/jpeg',
            ],
        ];
    }
}
