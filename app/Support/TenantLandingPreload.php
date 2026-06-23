<?php

namespace App\Support;

class TenantLandingPreload
{
    /**
     * Puck hero blocks and the prop that holds their LCP image.
     *
     * @var array<string, string>
     */
    private const HERO_IMAGE_PROPS = [
        'Hero1' => 'imageUrl',
        'Hero2' => 'imageUrl',
        'Hero3' => 'backgroundUrl',
        'Hero4' => 'imageUrl',
        'Hero5' => 'imageUrl',
        'Hero6' => 'backgroundUrl',
        'Cta4' => 'backgroundUrl',
    ];

    /**
     * @return list<array{href: string, as: string, type?: string}>
     */
    public static function preloadHintsFromLandingData(?string $landingPageData): array
    {
        $heroUrl = self::resolveHeroImageUrl($landingPageData);

        if ($heroUrl === null) {
            return [];
        }

        $hints = [];

        if (str_ends_with(strtolower($heroUrl), '.webp')) {
            $hints[] = [
                'href' => $heroUrl,
                'as' => 'image',
                'type' => 'image/webp',
            ];
        } else {
            $webp = preg_replace('/\.(jpe?g|png)$/i', '.webp', $heroUrl);

            if (is_string($webp) && $webp !== $heroUrl) {
                $hints[] = [
                    'href' => $webp,
                    'as' => 'image',
                    'type' => 'image/webp',
                ];
            }

            $hints[] = [
                'href' => $heroUrl,
                'as' => 'image',
                'type' => self::mimeTypeForUrl($heroUrl),
            ];
        }

        return $hints;
    }

    public static function resolveHeroImageUrl(?string $landingPageData): ?string
    {
        if ($landingPageData === null || $landingPageData === '') {
            return null;
        }

        $decoded = json_decode($landingPageData, true);

        if (! is_array($decoded)) {
            return null;
        }

        $content = $decoded['content'] ?? [];

        if (! is_array($content)) {
            return null;
        }

        foreach ($content as $block) {
            if (! is_array($block)) {
                continue;
            }

            $type = $block['type'] ?? null;
            $props = $block['props'] ?? null;

            if (! is_string($type) || ! is_array($props)) {
                continue;
            }

            $prop = self::HERO_IMAGE_PROPS[$type] ?? null;

            if ($prop === null) {
                continue;
            }

            $rawValue = $props[$prop] ?? null;

            if (! is_string($rawValue) || $rawValue === '') {
                continue;
            }

            $url = self::resolveImageUrl($rawValue);

            if ($url !== null) {
                return $url;
            }
        }

        return null;
    }

    public static function resolveImageUrl(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $trimmed = trim($value);

        if (str_starts_with($trimmed, '{')) {
            $decoded = json_decode($trimmed, true);

            if (is_array($decoded) && is_string($decoded['src'] ?? null) && $decoded['src'] !== '') {
                return $decoded['src'];
            }
        }

        return $trimmed;
    }

    private static function mimeTypeForUrl(string $url): string
    {
        return match (true) {
            str_ends_with(strtolower($url), '.png') => 'image/png',
            str_ends_with(strtolower($url), '.jpg'),
            str_ends_with(strtolower($url), '.jpeg') => 'image/jpeg',
            default => 'image/webp',
        };
    }
}
