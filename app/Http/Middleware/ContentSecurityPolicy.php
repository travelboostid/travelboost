<?php

namespace App\Http\Middleware;

use App\Support\ContentSecurityPolicy as ContentSecurityPolicyBuilder;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ContentSecurityPolicy
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if (! config('csp.enabled', true)) {
            return $response;
        }

        if ($response->headers->has('Content-Security-Policy')) {
            return $response;
        }

        $response->headers->set(
            'Content-Security-Policy',
            ContentSecurityPolicyBuilder::headerValue(),
        );

        return $response;
    }
}
