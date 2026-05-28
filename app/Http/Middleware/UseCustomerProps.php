<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class UseCustomerProps
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        /** @var Company | null */
        $tenant = Context::get('tenant');

        if ($tenant == null) {
            return $next($request);
        }

        $tenant->loadMissing(['settings', 'googleAccount.analyticsConnection']);

        Inertia::share('tenant', $tenant);

        return $next($request);
    }
}
