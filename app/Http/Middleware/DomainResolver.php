<?php

namespace App\Http\Middleware;

use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\Domain;
use Closure;
use Illuminate\Support\Facades\Cache;
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
        $this->appHost = (string) config('app.host', 'localhost');
        $this->currentHost = request()->getHost();
        $this->isMainHost = $this->currentHost === $this->appHost;
    }

    public function handle($request, Closure $next)
    {
        // Redirect to main domain if accessing company dashboard or other non-guest routes on a subdomain
        if (! $this->isMainHost && ! $this->isInternalSubdomain() && $request->is('companies*')) {
            $allowedPatterns = [
                'companies/login*',
                'companies/register*',
                'companies/accept-team-invitation*',
            ];

            $isAllowed = false;
            foreach ($allowedPatterns as $pattern) {
                if ($request->is($pattern)) {
                    $isAllowed = true;
                    break;
                }
            }

            if (! $isAllowed) {
                $port = $request->getPort();
                $portSuffix = in_array($port, [80, 443], true) ? '' : ':'.$port;

                return redirect()->away(
                    $request->getScheme().'://'.$this->appHost.$portSuffix.'/'.$request->path()
                    .($request->getQueryString() ? '?'.$request->getQueryString() : '')
                );
            }
        }

        // Main host has no tenant context
        if ($this->isMainHost || $this->isInternalSubdomain()) {
            $request->attributes->set('tenant', null);

            return $next($request);
        }

        // Resolve tenant from subdomain or custom domain
        $domainObject = $this->resolveDomain();

        if ($domainObject === null) {
            if ($this->shouldAllowDomainlessOnboarding($request)) {
                return $this->continueOnboardingWithoutTenant($request, $next);
            }

            return Inertia::render('errors/invalid-tenant-domain')
                ->toResponse($request)
                ->setStatusCode(404);
        }

        $isSubdomainAccess = Str::endsWith($this->currentHost, '.'.$this->appHost);
        $isAllowed = $isSubdomainAccess
            ? (bool) $domainObject->subdomain_enabled
            : (bool) $domainObject->domain_enabled;

        if (! $isAllowed) {
            if ($this->shouldAllowDomainlessOnboarding($request)) {
                return $this->continueOnboardingWithoutTenant($request, $next, $domainObject);
            }

            return Inertia::render('errors/invalid-tenant-domain')
                ->toResponse($request)
                ->setStatusCode(404);
        }

        Context::add('domain', $domainObject);

        // TODO: switch usage to context
        if ($domainObject->owner instanceof Company) {
            $request->attributes->set('tenant', $domainObject->owner);
            Context::add('tenant', $domainObject->owner);
        } elseif ($domainObject->owner instanceof AffiliateProfile) {
            Context::add('affiliate', $domainObject->owner);
        }

        return $next($request);
    }

    /** Resolve domain from subdomain or custom domain name */
    private function resolveDomain(): ?Domain
    {
        // Check if current host is a subdomain of the main app host
        if (Str::endsWith($this->currentHost, '.'.$this->appHost)) {
            $subdomain = Str::before($this->currentHost, '.'.$this->appHost);

            return Cache::remember(
                "domain:subdomain:{$subdomain}",
                now()->addMinutes(5),
                fn (): ?Domain => Domain::query()
                    ->where('subdomain', $subdomain)
                    ->with('owner')
                    ->first(),
            );
        }

        // Fall back to custom domain lookup
        return Cache::remember(
            "domain:host:{$this->currentHost}",
            now()->addMinutes(5),
            fn (): ?Domain => Domain::query()
                ->where('domain', $this->currentHost)
                ->with('owner')
                ->first(),
        );
    }

    /** Check if the current host is an internal subdomain (e.g. affiliate) */
    private function isInternalSubdomain(): bool
    {
        if (Str::endsWith($this->currentHost, '.'.$this->appHost)) {
            $subdomain = Str::before($this->currentHost, '.'.$this->appHost);

            return in_array($subdomain, $this->internalSubdomains);
        }

        return false;
    }

    private function shouldAllowDomainlessOnboarding($request): bool
    {
        return $request->is('me/onboarding*');
    }

    private function continueOnboardingWithoutTenant($request, Closure $next, ?Domain $domainObject = null)
    {
        $request->attributes->set('tenant', null);

        if ($domainObject !== null) {
            Context::add('domain', $domainObject);

            if ($domainObject->owner instanceof AffiliateProfile) {
                Context::add('affiliate', $domainObject->owner);
            }
        }

        return $next($request);
    }
}
