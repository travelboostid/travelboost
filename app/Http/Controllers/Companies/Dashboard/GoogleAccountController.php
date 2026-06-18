<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\GoogleAdsService;
use App\Services\GoogleAnalyticsService;
use App\Support\MarketingFeatures;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;

class GoogleAccountController extends Controller
{
    private const string ADWORDS_SCOPE = 'https://www.googleapis.com/auth/adwords';

    public function __construct(
        private GoogleAnalyticsService $analyticsService,
        private GoogleAdsService $googleAdsService,
    ) {}

    public function connect(Request $request, Company $company)
    {
        return Socialite::driver('google')
            ->scopes([
                'https://www.googleapis.com/auth/analytics.readonly',
                'https://www.googleapis.com/auth/analytics.edit',
            ])
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent',
                'state' => json_encode([
                    'intent' => 'connect-analytics',
                    'company_id' => $company->id,
                ]),
            ])
            ->redirect();
    }

    public function connectAds(Request $request, Company $company)
    {
        if (! MarketingFeatures::googleAdsEnabled()) {
            return redirect()
                ->route('companies.dashboard.marketing.budget.show', $company)
                ->with('error', 'Google Ads is not available yet.');
        }

        return Socialite::driver('google')
            ->scopes([
                self::ADWORDS_SCOPE,
                'https://www.googleapis.com/auth/analytics.readonly',
            ])
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent',
                'state' => json_encode([
                    'intent' => 'connect-google-ads',
                    'company_id' => $company->id,
                ]),
            ])
            ->redirect();
    }

    public function disconnect(Request $request, Company $company)
    {
        try {
            $this->analyticsService->disconnectGoogleAccount($company);
            $this->googleAdsService->disconnect($company);
        } catch (RuntimeException) {
            abort(404);
        }

        return redirect()
            ->back(fallback: route('companies.dashboard.settings.linked-accounts.index', $company))
            ->with('success', 'Google account disconnected.');
    }
}
