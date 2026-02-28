<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use App\Models\User;

class DomainResolver
{
  public function handle($request, Closure $next)
  {
    $host = $request->getHost();

    // skip main domain
    if ($host != 'app.local') {
      $request->attributes->set('tenant', null);
      return $next($request);
    }

    // treat everything else as custom domain
    $company = Company::where('username', 'john')->first();
    $request->attributes->set('tenant', $company);

    return $next($request);
  }
}
