<?php

namespace App\Http\Middleware;

use BackedEnum;
use Closure;
use Illuminate\Http\Request;

class CheckUserStatus
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        $status = $user->status instanceof BackedEnum
            ? $user->status->value
            : $user->status;

        if ($status === 'inactive' && ! str_starts_with($request->path(), 'me/onboarding')) {
            return redirect('/me/onboarding');
        } elseif ($status !== null && $status !== 'inactive' && str_starts_with($request->path(), 'me/onboarding')) {
            return redirect('/me');
        }

        return $next($request);
    }
}
