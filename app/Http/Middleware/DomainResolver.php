<?php

namespace App\Http\Middleware;

use App\Models\Company;
use App\Models\Domain;
use Closure;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DomainResolver
{
  private string $appHost;
  private string $currentHost;
  private bool $isMainHost;
  private array $internalSubdomains = ['affiliate'];

  public function __construct()
  {
    $this->appHost = env('APP_HOST', 'localhost');
    $this->currentHost = request()->getHost();
    $this->isMainHost = $this->currentHost === $this->appHost;
  }

  public function handle($request, Closure $next)
  {
    // Main host has no tenant context
    if ($this->isMainHost || $this->isInternalSubdomain()) {
      $request->attributes->set('tenant', null);
      return $next($request);
    }

    // Resolve tenant from subdomain or custom domain
    $domainObject = $this->resolveDomain();

    // KEAMANAN TAMBAHAN: Blokir jika domain tidak ditemukan ATAU domain belum diaktifkan (domain_enabled == false)
    if ($domainObject === null || !$domainObject->domain_enabled) {
      return Inertia::render('errors/invalid-tenant-domain')
        ->toResponse($request)
        ->setStatusCode(404);
    }

    Context::add('domain', $domainObject);

    // TODO: switch usage to context
    if ($domainObject->owner instanceof Company) {
      $request->attributes->set('tenant', $domainObject->owner);
    }

    return $next($request);
  }

  /** Resolve domain from subdomain or custom domain name */
  private function resolveDomain(): ?Domain
  {
    // Check if current host is a subdomain of the main app host
    if (Str::endsWith($this->currentHost, '.' . $this->appHost)) {
      $subdomain = Str::before($this->currentHost, '.' . $this->appHost);
      return Domain::where('subdomain', $subdomain)->with('owner')->first();
    }

    // Fall back to custom domain lookup
    return Domain::where('domain', $this->currentHost)->with('owner')->first();
  }

  /** Check if the current host is an internal subdomain (e.g. affiliate) */
  private function isInternalSubdomain(): bool
  {
    if (Str::endsWith($this->currentHost, '.' . $this->appHost)) {
      $subdomain = Str::before($this->currentHost, '.' . $this->appHost);
      return in_array($subdomain, $this->internalSubdomains);
    }
    return false;
  }
}
