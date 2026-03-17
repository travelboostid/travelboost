<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
  public function handle(Request $request, Closure $next)
  {
    $user = $request->user();

    if (!$user) {
      return redirect('/login');
    }

    if (($user->status->value == 'inactive') && !str_starts_with($request->path(), 'me/onboarding')) {
      return redirect('/me/onboarding');
    } else if ($user->status->value != 'inactive' && str_starts_with($request->path(), 'me/onboarding')) {
      return redirect('/me');
    }

    return $next($request);
  }
}
