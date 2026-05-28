<?php

namespace App\Http\Middleware;

use App\Models\AffiliateProfile;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class UseAffiliateProps
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        /** @var AffiliateProfile | null */
        $affiliate = Context::get('affiliate');

        if ($affiliate == null) {
            return $next($request);
        }

        Inertia::share('affiliate', $affiliate);

        return $next($request);
    }
}
