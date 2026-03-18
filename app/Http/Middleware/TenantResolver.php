<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TenantResolver
{
  public function handle($request, Closure $next)
  {
    $appHost = env('APP_HOST', 'localhost');
    $currentHost = $request->getHost();
    // skip main domain
    if ($currentHost == $appHost) {
      $request->attributes->set('tenant', null);
      return $next($request);
    }

    if (Str::endsWith($currentHost, '.' . $appHost)) {
      $subdomain = Str::before($currentHost, '.' . $appHost);
      $company = Company::where('subdomain', $subdomain)->first();
      if ($company == null) {
        return Inertia::render('errors/invalid-tenant-subdomain')
          ->toResponse($request)
          ->setStatusCode(404);
      }
      $request->attributes->set('tenant', $company);
    } else {
      // user use custom domain
      // currently unsupported, show error
      return Inertia::render('errors/invalid-tenant-domain')
        ->toResponse($request)
        ->setStatusCode(404);
    }
    return $next($request);
  }
}
