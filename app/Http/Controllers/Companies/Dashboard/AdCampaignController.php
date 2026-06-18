<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\AdCampaignStatus;
use App\Enums\AdPlatform;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\CreateAdCampaignRequest;
use App\Models\AdCampaign;
use App\Models\Company;
use App\Services\GoogleAdsService;
use App\Services\MetaAdsService;
use App\Services\PromotionBudgetService;
use App\Support\MarketingFeatures;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AdCampaignController extends Controller
{
    public function __construct(
        private GoogleAdsService $googleAdsService,
        private MetaAdsService $metaAdsService,
        private PromotionBudgetService $promotionBudgetService,
    ) {}

    public function index(Request $request, Company $company): Response
    {
        $googleConnection = $company->googleAdsConnection()->first();
        $metaConnection = $company->metaAdsConnection()->first();

        $campaigns = $company->adCampaigns()
            ->whereIn('platform', [AdPlatform::Google, AdPlatform::Meta])
            ->latest()
            ->get()
            ->map(fn (AdCampaign $campaign) => [
                'id' => $campaign->id,
                'platform' => $campaign->platform->value,
                'name' => $campaign->name,
                'status' => $campaign->status->value,
                'daily_budget' => (float) $campaign->daily_budget,
                'final_url' => $campaign->final_url,
                'lifetime_spend' => (float) $campaign->lifetime_spend,
                'external_campaign_id' => $campaign->external_campaign_id,
                'created_at' => $campaign->created_at?->toISOString(),
            ]);

        return Inertia::render('companies/dashboard/marketing/campaigns/index', [
            'campaigns' => $campaigns,
            'budgetBalance' => $this->promotionBudgetService->balance($company),
            'adCampaignsEnabled' => MarketingFeatures::adCampaignsEnabled(),
            'googleAdsReady' => MarketingFeatures::googleAdsEnabled()
                && ($googleConnection?->isReadyForCampaigns() ?? false),
            'googleAdsConnectionStatus' => $googleConnection?->status->value,
            'metaAdsReady' => MarketingFeatures::metaAdsEnabled()
                && ($metaConnection?->isReadyForCampaigns() ?? false),
            'metaAdsConnectionStatus' => $metaConnection?->status->value,
            'defaultLandingPageUrl' => $this->googleAdsService->defaultLandingPageUrl($company),
            'googleAdsConfigured' => $this->googleAdsService->isConfigured(),
            'metaAdsConfigured' => $this->metaAdsService->isConfigured(),
        ]);
    }

    public function create(Request $request, Company $company): Response|RedirectResponse
    {
        if (! MarketingFeatures::adCampaignsEnabled()) {
            return redirect()
                ->route('companies.dashboard.marketing.campaigns.index', $company);
        }

        $platform = AdPlatform::tryFrom((string) $request->query('platform', AdPlatform::Google->value))
            ?? AdPlatform::Google;

        if (! in_array($platform, [AdPlatform::Google, AdPlatform::Meta], true)) {
            $platform = AdPlatform::Google;
        }

        if (! MarketingFeatures::isPlatformEnabled($platform)) {
            return redirect()
                ->route('companies.dashboard.marketing.campaigns.index', $company)
                ->with('error', 'This ad platform is not available yet.');
        }

        $googleConnection = $company->googleAdsConnection()->first();
        $metaConnection = $company->metaAdsConnection()->first();

        return Inertia::render('companies/dashboard/marketing/campaigns/create', [
            'platform' => $platform->value,
            'budgetBalance' => $this->promotionBudgetService->balance($company),
            'defaultLandingPageUrl' => $this->googleAdsService->defaultLandingPageUrl($company),
            'minDailyBudget' => 50_000,
            'googleAdsReady' => MarketingFeatures::googleAdsEnabled()
                && ($googleConnection?->isReadyForCampaigns() ?? false),
            'googleAdsConnectionStatus' => $googleConnection?->status->value,
            'metaAdsReady' => MarketingFeatures::metaAdsEnabled()
                && ($metaConnection?->isReadyForCampaigns() ?? false),
            'metaAdsConnectionStatus' => $metaConnection?->status->value,
            'googleAdsConfigured' => $this->googleAdsService->isConfigured(),
            'metaAdsConfigured' => $this->metaAdsService->isConfigured(),
        ]);
    }

    public function store(CreateAdCampaignRequest $request, Company $company): RedirectResponse
    {
        $platform = AdPlatform::from($request->validated('platform'));

        try {
            MarketingFeatures::assertPlatformEnabled($platform);
        } catch (RuntimeException $exception) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', $exception->getMessage());
        }

        $payload = [
            'name' => $request->validated('name'),
            'final_url' => $request->validated('final_url'),
            'daily_budget' => (float) $request->validated('daily_budget'),
            'headlines' => array_values($request->validated('headlines')),
            'descriptions' => array_values($request->validated('descriptions')),
        ];

        try {
            match ($platform) {
                AdPlatform::Google => $this->googleAdsService->createPerformanceMaxCampaign($company, $payload),
                AdPlatform::Meta => $this->metaAdsService->createTrafficCampaign($company, $payload),
                default => throw new RuntimeException('Unsupported ad platform.'),
            };
        } catch (RuntimeException $exception) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', $exception->getMessage());
        }

        $label = $platform === AdPlatform::Meta ? 'Meta Ads' : 'Google Ads';

        return redirect()
            ->route('companies.dashboard.marketing.campaigns.index', $company)
            ->with('success', "{$label} campaign created.");
    }

    public function pause(Company $company, AdCampaign $campaign): RedirectResponse
    {
        if ($campaign->company_id !== $company->id) {
            abort(404);
        }

        if ($campaign->status !== AdCampaignStatus::Active) {
            return redirect()
                ->back()
                ->with('error', 'Only active campaigns can be paused.');
        }

        try {
            MarketingFeatures::assertPlatformEnabled($campaign->platform);
        } catch (RuntimeException $exception) {
            return redirect()
                ->back()
                ->with('error', $exception->getMessage());
        }

        try {
            match ($campaign->platform) {
                AdPlatform::Google => $this->googleAdsService->pauseCampaign($campaign),
                AdPlatform::Meta => $this->metaAdsService->pauseCampaign($campaign),
                default => throw new RuntimeException('Unsupported ad platform.'),
            };
        } catch (RuntimeException $exception) {
            return redirect()
                ->back()
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->back()
            ->with('success', 'Campaign paused.');
    }
}
