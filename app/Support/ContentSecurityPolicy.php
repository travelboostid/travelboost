<?php

namespace App\Support;

class ContentSecurityPolicy
{
    private static ?string $nonce = null;

    public static function setNonce(string $nonce): void
    {
        self::$nonce = $nonce;
    }

    public static function nonce(): ?string
    {
        return self::$nonce;
    }

    public static function clearNonce(): void
    {
        self::$nonce = null;
    }

    /**
     * @return array<string, list<string>>
     */
    public static function directives(): array
    {
        /** @var array<string, list<string>> $directives */
        $directives = config('csp.directives', []);

        $mediaFrameOrigin = MediaCdn::preconnectOrigin();

        if ($mediaFrameOrigin !== null) {
            $directives['frame-src'][] = $mediaFrameOrigin;
        }

        if (self::$nonce !== null) {
            $directives['script-src'][] = "'nonce-".self::$nonce."'";
        }

        $directives['connect-src'] = array_values(array_unique(array_merge(
            $directives['connect-src'] ?? [],
            self::reverbConnectSources(),
            self::localDevConnectSources(),
        )));

        return $directives;
    }

    public static function headerValue(): string
    {
        return collect(self::directives())
            ->map(function (array $sources, string $directive): string {
                $normalizedSources = array_values(array_unique(array_filter($sources)));

                return $directive.' '.implode(' ', $normalizedSources);
            })
            ->implode('; ');
    }

    /**
     * @return list<string>
     */
    public static function reverbConnectSources(): array
    {
        if ((string) config('broadcasting.default') !== 'reverb') {
            return [];
        }

        /** @var array{host?: string, port?: int|string, scheme?: string} $options */
        $options = config('broadcasting.connections.reverb.options', []);

        $hosts = array_values(array_unique(array_filter([
            self::normalizeHost((string) ($options['host'] ?? '')),
            self::normalizeHost((string) env('VITE_REVERB_HOST')),
            self::normalizeHost((string) env('REVERB_HOST')),
            self::normalizeHost((string) env('APP_HOST')),
            self::normalizeHost(parse_url((string) config('app.url'), PHP_URL_HOST) ?: ''),
        ])));

        if ($hosts === []) {
            return [];
        }

        $port = (int) (env('VITE_REVERB_PORT') ?: env('REVERB_PORT') ?: ($options['port'] ?? 443));
        $scheme = (string) (env('VITE_REVERB_SCHEME') ?: env('REVERB_SCHEME') ?: ($options['scheme'] ?? 'https'));

        $sources = [];

        foreach ($hosts as $host) {
            $sources[] = "{$scheme}://{$host}";
            $sources[] = "ws://{$host}";
            $sources[] = "wss://{$host}";

            if ($port > 0) {
                $sources[] = "{$scheme}://{$host}:{$port}";
                $sources[] = "ws://{$host}:{$port}";
                $sources[] = "wss://{$host}:{$port}";
            }
        }

        return array_values(array_unique($sources));
    }

    /**
     * @return list<string>
     */
    public static function localDevConnectSources(): array
    {
        if (! app()->environment('local')) {
            return [];
        }

        $vitePort = (int) env('VITE_DEV_SERVER_PORT', 5173);
        $hosts = array_values(array_unique(array_filter([
            'localhost',
            '127.0.0.1',
            self::normalizeHost((string) env('APP_HOST')),
            self::normalizeHost((string) env('VITE_REVERB_HOST')),
            self::normalizeHost((string) env('REVERB_HOST')),
        ])));

        $sources = [];

        foreach ($hosts as $host) {
            $sources[] = "http://{$host}:{$vitePort}";
            $sources[] = "ws://{$host}:{$vitePort}";
        }

        return array_values(array_unique($sources));
    }

    private static function normalizeHost(string $host): ?string
    {
        $host = trim($host, " \t\n\r\0\x0B\"'");

        return $host !== '' ? $host : null;
    }
}
