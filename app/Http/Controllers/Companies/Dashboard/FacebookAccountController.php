<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\MetaAdsService;
use App\Services\MetaAnalyticsService;
use App\Support\MarketingFeatures;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;

class FacebookAccountController extends Controller
{
    private const array ADS_SCOPES = [
        'ads_management',
        'ads_read',
        'business_management',
    ];

    public function __construct(
        private MetaAnalyticsService $metaAnalyticsService,
        private MetaAdsService $metaAdsService,
    ) {}

    public function connect(Request $request, Company $company)
    {
        return Socialite::driver('facebook')
            ->setScopes([
                'ads_read',
                'business_management',
            ])
            ->with([
                'state' => json_encode([
                    'intent' => 'connect-meta-analytics',
                    'company_id' => $company->id,
                ]),
            ])
            ->redirect();
    }

    public function connectAds(Request $request, Company $company)
    {
        if (! MarketingFeatures::metaAdsEnabled()) {
            return redirect()
                ->route('companies.dashboard.marketing.budget.show', $company)
                ->with('error', 'Meta Ads is not available yet.');
        }

        return Socialite::driver('facebook')
            ->setScopes(self::ADS_SCOPES)
            ->with([
                'state' => json_encode([
                    'intent' => 'connect-meta-ads',
                    'company_id' => $company->id,
                ]),
            ])
            ->redirect();
    }

    public function disconnect(Request $request, Company $company)
    {
        try {
            $this->metaAnalyticsService->disconnectFacebookAccount($company);
            $this->metaAdsService->disconnect($company);
        } catch (RuntimeException) {
            abort(404);
        }

        return redirect()
            ->back(fallback: route('companies.dashboard.settings.linked-accounts.index', $company))
            ->with('success', 'Facebook account disconnected.');
    }
}
