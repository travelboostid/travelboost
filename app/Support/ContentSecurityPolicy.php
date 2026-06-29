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

        if (self::$nonce !== null) {
            $directives['script-src'][] = "'nonce-".self::$nonce."'";
        }

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
}
