<?php

namespace App\Support;

use Illuminate\Foundation\Vite;

class ViteAssetUrl
{
    /**
     * Resolve Vite build assets as same-origin relative paths so tenant
     * subdomains and custom domains never load JS/CSS from APP_URL.
     */
    public static function resolve(string $path, ?bool $secure = null): string
    {
        if (
            str_starts_with($path, 'http://')
            || str_starts_with($path, 'https://')
            || str_starts_with($path, '//')
        ) {
            return $path;
        }

        $vite = app(Vite::class);

        if ($vite->isRunningHot()) {
            return self::hotAssetUrl($vite, $path, $secure);
        }

        return '/'.ltrim($path, '/');
    }

    private static function hotAssetUrl(Vite $vite, string $path, ?bool $secure = null): string
    {
        $hotFile = $vite->hotFile();

        if (! is_file($hotFile)) {
            return asset($path, $secure);
        }

        $hotUrl = file_get_contents($hotFile);

        if ($hotUrl === false || trim($hotUrl) === '') {
            return asset($path, $secure);
        }

        return rtrim(trim($hotUrl), '/').'/'.ltrim($path, '/');
    }
}
