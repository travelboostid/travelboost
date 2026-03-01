<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TenantResolver
{
  public function handle($request, Closure $next)
  {
    $appHost = env('APP_HOST', 'localhost');
    $currentHost = $request->getHost();
    // skip main domain
    Log::info("cccccc", ['a' => $currentHost, 'b' => $appHost]);
    if ($currentHost == $appHost) {
      $request->attributes->set('tenant', null);
      return $next($request);
    }

    if (Str::endsWith($currentHost, '.' . $appHost)) {
      $username = Str::before($currentHost, '.' . $appHost);
      $company = Company::where('username', $username)->first();
      if ($company == null) {
        return Inertia::render('errors/invalid-tenant-username')
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

    Log::info("Hmmm");
    return $next($request);
  }
}
