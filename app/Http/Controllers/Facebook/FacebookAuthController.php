<?php

namespace App\Http\Controllers\Facebook;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\MetaAdsService;
use App\Services\MetaAnalyticsService;
use App\Support\MarketingFeatures;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class FacebookAuthController extends Controller
{
    public function __construct(
        private MetaAnalyticsService $metaAnalyticsService,
        private MetaAdsService $metaAdsService,
    ) {}

    public function callback(Request $request)
    {
        $facebookUser = Socialite::driver('facebook')
            ->stateless()
            ->user();

        $state = json_decode($request->input('state'), true);

        $intent = $state['intent'] ?? null;

        return match ($intent) {
            'connect-meta-analytics' => $this->continueToConnectMetaAnalytics($state, $facebookUser),
            'connect-meta-ads' => $this->continueToConnectMetaAds($state, $facebookUser),
            default => abort(400, 'Invalid OAuth intent'),
        };
    }

    /**
     * @param  array<string, mixed>  $state
     */
    private function continueToConnectMetaAnalytics(array $state, mixed $facebookUser)
    {
        $company = Company::findOrFail($state['company_id']);

        $this->metaAnalyticsService->upsertFacebookAccount($company, $facebookUser);

        return redirect()
            ->route('companies.dashboard.analytics.meta.selectPixel', [
                'company' => $company->username,
            ]);
    }

    /**
     * @param  array<string, mixed>  $state
     */
    private function continueToConnectMetaAds(array $state, mixed $facebookUser)
    {
        $company = Company::findOrFail($state['company_id']);

        if (! MarketingFeatures::metaAdsEnabled()) {
            return redirect()
                ->route('companies.dashboard.marketing.budget.show', [
                    'company' => $company->username,
                ])
                ->with('error', 'Meta Ads is not available yet.');
        }

        $this->metaAnalyticsService->upsertFacebookAccount($company, $facebookUser);

        try {
            $this->metaAdsService->connect($company->fresh());
        } catch (\RuntimeException $exception) {
            return redirect()
                ->route('companies.dashboard.marketing.budget.show', [
                    'company' => $company->username,
                ])
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('companies.dashboard.marketing.budget.show', [
                'company' => $company->username,
            ])
            ->with('success', 'Meta Ads account setup started.');
    }
}
