<?php

namespace App\Support;

class ContentSecurityPolicy
{
    /**
     * @return array<string, list<string>>
     */
    public static function directives(): array
    {
        /** @var array<string, list<string>> $directives */
        $directives = config('csp.directives', []);

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
