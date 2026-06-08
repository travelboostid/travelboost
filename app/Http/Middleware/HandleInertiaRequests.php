<?php

namespace App\Http\Middleware;

use App\Models\AffiliateProfile;
use App\Models\AppConfig;
use App\Models\Company;
use App\Models\Domain;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    // NOTE: Don't load everything there. Create a middleware to share non public data. Then use the middleware accordingly
    // For example create UseCompanyProps -> Share props.company -> only applied to routes who use the middleware
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'appDomain' => env('APP_HOST', 'localhost'),
            'auth' => [
                'user' => $request->user()?->load(['companies']),
                'permissions' => $request->user()?->allPermissions()->pluck('name')->toArray(),
                'roles' => $request->user()?->roles->pluck('name')->toArray(),
                'teams' => $request->user()?->allTeams()->pluck('name')->toArray(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'tab' => $request->session()->get('tab'),
                'account_inactive' => $request->session()->get('account_inactive'),
                'warning' => $request->session()->get('warning'),
                'success' => $request->session()->get('success'),
                'bookingPaymentResult' => $request->session()->get('bookingPaymentResult'),
            ],
            'customerUnreadNotificationsCount' => $request->user()?->unreadNotifications()->count() ?? 0,
            'affiliateUnreadNotificationsCount' => $request->user()?->unreadNotifications()->count() ?? 0,
            'travelboostWhatsapp' => fn (): ?string => data_get(
                AppConfig::query()->where('key', 'admin')->first()?->value,
                'wa_cs'
            ),
            'affiliatePageUrl' => fn (): ?string => $this->resolveAffiliatePageUrl($request),
        ];
    }

    private function resolveAffiliatePageUrl(Request $request): ?string
    {
        $profile = $request->user()?->affiliateProfile;

        if (! $profile instanceof AffiliateProfile) {
            return null;
        }

        $domain = Domain::query()
            ->whereIn('owner_type', ['affiliate', AffiliateProfile::class])
            ->where('owner_id', $profile->id)
            ->first();

        if (! $domain) {
            return null;
        }

        if ($domain->domain_enabled && filled($domain->domain)) {
            return $request->getScheme().'://'.$domain->domain;
        }

        if ($domain->subdomain_enabled && filled($domain->subdomain)) {
            $port = $request->getPort();
            $portSuffix = in_array($port, [80, 443], true) ? '' : ':'.$port;

            return $request->getScheme().'://'.$domain->subdomain.'.'.env('APP_HOST', 'localhost').$portSuffix;
        }

        return null;
    }
}
