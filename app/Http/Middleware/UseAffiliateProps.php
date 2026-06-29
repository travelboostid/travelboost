<?php

namespace App\Http\Middleware;

use App\Support\AffiliateReferralContext;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class UseAffiliateProps
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, AffiliateReferralContext $affiliateReferralContext)
    {
        $affiliate = $affiliateReferralContext->visibleAffiliatePayload($request);

        if ($affiliate === null) {
            return $next($request);
        }

        Inertia::share('affiliate', $affiliate);

        return $next($request);
    }
}
