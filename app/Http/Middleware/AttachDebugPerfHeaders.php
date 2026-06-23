<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AttachDebugPerfHeaders
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! config('app.debug')) {
            return $response;
        }

        /** @var array<string, int|float|string>|null $metrics */
        $metrics = $request->attributes->get('debug_perf_metrics');

        if ($metrics === null) {
            return $response;
        }

        foreach ($metrics as $key => $value) {
            $response->headers->set(
                'X-Debug-'.str_replace('_', '-', $key),
                (string) $value,
                false,
            );
        }

        return $response;
    }
}
