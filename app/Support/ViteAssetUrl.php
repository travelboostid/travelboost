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
            return self::assetUrlFromConfig($path, $secure);
        }

        $hotUrl = file_get_contents($hotFile);

        if ($hotUrl === false || trim($hotUrl) === '') {
            return self::assetUrlFromConfig($path, $secure);
        }

        return rtrim(trim($hotUrl), '/').'/'.ltrim($path, '/');
    }

    private static function assetUrlFromConfig(string $path, ?bool $secure = null): string
    {
        $root = rtrim((string) config('app.url'), '/');

        if ($root === '') {
            return '/'.ltrim($path, '/');
        }

        if ($secure !== null) {
            $host = parse_url($root, PHP_URL_HOST);
            $port = parse_url($root, PHP_URL_PORT);

            if (is_string($host) && $host !== '') {
                $root = ($secure ? 'https' : 'http').'://'.$host;

                if ($port !== null) {
                    $root .= ':'.$port;
                }
            }
        }

        return $root.'/'.ltrim($path, '/');
    }
}
