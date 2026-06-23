<?php

namespace App\Support;

class DebugPerfLogger
{
    public static function log(string $location, string $message, array $data = [], string $hypothesisId = ''): void
    {
        if (! config('app.debug')) {
            return;
        }

        $entry = json_encode([
            'sessionId' => '4b26bb',
            'location' => $location,
            'message' => $message,
            'data' => $data,
            'timestamp' => (int) round(microtime(true) * 1000),
            'hypothesisId' => $hypothesisId,
        ], JSON_UNESCAPED_SLASHES);

        if ($entry === false) {
            return;
        }

        file_put_contents(base_path('debug-4b26bb.log'), $entry."\n", FILE_APPEND | LOCK_EX);
    }

    /**
     * @param  array<string, int|float|string>  $metrics
     */
    public static function attachResponseHeaders(array $metrics): void
    {
        if (! config('app.debug')) {
            return;
        }

        request()->attributes->set('debug_perf_metrics', $metrics);
    }
}
