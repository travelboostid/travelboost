<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHasAdminAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }
        if (! $user->hasRole(['company:0:superadmin', 'company:0:admin'])) {
            abort(403, 'Unauthorized: Required Internal Admin privileges (Scope: company:0).');
        }

        return $next($request);
    }
}
