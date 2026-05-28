<?php

namespace App\Http\Middleware;

use App\Models\AnonymousUser;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class SetAndUseAnonymousUserProps
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $anonymousUserToken = $request->cookie('anonymous_user_token');

        if ($request->user()) {
            return $next($request);
        }

        $anonymousUser = $anonymousUserToken ? AnonymousUser::where('token', $anonymousUserToken)->first() : null;
        if ($anonymousUser) {
            return $next($request);
        }

        // create anonymous user only when needed
        $anonymousUser = AnonymousUser::create([
            'token' => Str::uuid()->toString(),
        ]);

        Cookie::queue('anonymous_user_token', $anonymousUser->token, 60 * 24 * 365);

        return $next($request);
    }
}
