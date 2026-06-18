<?php

namespace App\Http\Controllers\Google;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\GoogleAdsService;
use App\Services\GoogleAnalyticsService;
use App\Support\MarketingFeatures;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;

class GoogleAuthController extends Controller
{
    public function __construct(
        private GoogleAnalyticsService $analyticsService,
        private GoogleAdsService $googleAdsService,
    ) {}

    public function callback(Request $request)
    {
        $googleUser = Socialite::driver('google')
            ->stateless()
            ->user();

        $state = json_decode($request->input('state'), true);

        $intent = $state['intent'] ?? null;

        return match ($intent) {
            'connect-analytics' => $this->continueToConnectAnalytics($state, $googleUser),
            'connect-google-ads' => $this->continueToConnectGoogleAds($state, $googleUser),
            default => abort(400, 'Invalid OAuth intent'),
        };
    }

    private function continueToConnectAnalytics(mixed $state, mixed $googleUser)
    {
        $company = Company::findOrFail($state['company_id']);

        $this->analyticsService->upsertGoogleAccount($company, $googleUser);

        return redirect()
            ->route('companies.dashboard.analytics.index', [
                'company' => $company->username,
            ]);
    }

    private function continueToConnectGoogleAds(mixed $state, mixed $googleUser)
    {
        $company = Company::findOrFail($state['company_id']);

        if (! MarketingFeatures::googleAdsEnabled()) {
            return redirect()
                ->route('companies.dashboard.marketing.budget.show', [
                    'company' => $company->username,
                ])
                ->with('error', 'Google Ads is not available yet.');
        }

        $this->analyticsService->upsertGoogleAccount($company, $googleUser);

        try {
            $this->googleAdsService->connect($company->fresh());
        } catch (RuntimeException $exception) {
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
            ->with('success', 'Google Ads account setup started.');
    }
}
