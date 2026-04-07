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
    if ($currentHost === $appHost || $currentHost === '127.0.0.1' || $currentHost === 'localhost') {
      $request->attributes->set('tenant', null);
      return $next($request);
    }
    $baseHost = ($appHost === '127.0.0.1') ? 'localhost' : $appHost;

    if (Str::endsWith($currentHost, '.' . $baseHost)) {
      $subdomain = Str::before($currentHost, '.' . $baseHost);
      $company = Company::where('username', $subdomain)
                        ->orWhere('subdomain', $subdomain)
                        ->first();
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
