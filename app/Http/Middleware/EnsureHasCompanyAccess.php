<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHasCompanyAccess
{
  /**
   * Handle an incoming request.
   *
   * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
   */
  public function handle(Request $request, Closure $next): Response
  {
    $company = $request->route('company');
    $user = $request->user();

    if (! $user || ! $user->companies()->where('company_id', $company->id)->exists()) {
      return redirect('/');
    }

    return $next($request);
  }
}
