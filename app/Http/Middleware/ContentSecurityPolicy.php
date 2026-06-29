<?php

namespace App\Http\Middleware;

use App\Support\ContentSecurityPolicy as ContentSecurityPolicyBuilder;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class ContentSecurityPolicy
{
    public function handle(Request $request, Closure $next): Response
    {
        $nonce = null;

        if (config('csp.enabled', true)) {
            $nonce = base64_encode(random_bytes(16));
            ContentSecurityPolicyBuilder::setNonce($nonce);
            View::share('cspNonce', $nonce);
            Vite::useCspNonce($nonce);
        }

        /** @var Response $response */
        $response = $next($request);

        if ($nonce === null || $response->headers->has('Content-Security-Policy')) {
            ContentSecurityPolicyBuilder::clearNonce();

            return $response;
        }

        $response->headers->set(
            'Content-Security-Policy',
            ContentSecurityPolicyBuilder::headerValue(),
        );

        ContentSecurityPolicyBuilder::clearNonce();

        return $response;
    }
}
