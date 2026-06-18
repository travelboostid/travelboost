<?php

namespace App\Services;

use App\Contracts\AdPlatformService;
use App\Enums\AdCampaignStatus;
use App\Enums\AdPlatform;
use App\Enums\AdPlatformConnectionStatus;
use App\Models\AdCampaign;
use App\Models\AdPlatformConnection;
use App\Models\Company;
use App\Models\CompanyFacebookAccount;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class MetaAdsService implements AdPlatformService
{
    private const string ADS_MANAGEMENT_SCOPE = 'ads_management';

    private const string GRAPH_API_VERSION = 'v21.0';

    private const int JAKARTA_TIMEZONE_ID = 67;

    public function platform(): AdPlatform
    {
        return AdPlatform::Meta;
    }

    public function isConfigured(): bool
    {
        return filled($this->businessId())
            && filled($this->platformAccessToken())
            && filled($this->pageId());
    }

    public function connect(Company $company): AdPlatformConnection
    {
        $facebookAccount = $company->facebookAccount;

        if ($facebookAccount === null) {
            throw new RuntimeException('Connect a Facebook account before enabling Meta Ads.');
        }

        if (! $this->facebookAccountHasAdsScope($facebookAccount)) {
            throw new RuntimeException('Facebook account is missing the ads_management OAuth scope.');
        }

        $connection = AdPlatformConnection::query()->updateOrCreate(
            [
                'company_id' => $company->id,
                'platform' => AdPlatform::Meta,
            ],
            [
                'oauth_account_type' => $facebookAccount->getMorphClass(),
                'oauth_account_id' => $facebookAccount->id,
                'status' => AdPlatformConnectionStatus::PendingProvisioning,
                'meta' => [
                    'last_attempt_at' => now()->toISOString(),
                ],
            ]
        );

        return $this->provisionAdAccount($connection->fresh());
    }

    public function disconnect(Company $company): void
    {
        AdPlatformConnection::query()
            ->where('company_id', $company->id)
            ->where('platform', AdPlatform::Meta)
            ->delete();
    }

    public function provisionAdAccount(AdPlatformConnection $connection): AdPlatformConnection
    {
        $connection->loadMissing('company');

        if (! $this->isConfigured()) {
            return $this->markConnection($connection, AdPlatformConnectionStatus::PendingPlatformSetup, [
                'reason' => 'platform_not_configured',
                'message' => 'TravelBoost Meta Ads manager credentials are not configured yet.',
            ]);
        }

        if ($connection->status === AdPlatformConnectionStatus::Connected
            && filled($connection->external_account_id)) {
            return $connection;
        }

        try {
            $adAccount = $this->createAdAccount($connection->company);
        } catch (RequestException $exception) {
            Log::warning('Meta Ads ad account provisioning failed', [
                'company_id' => $connection->company_id,
                'status' => $exception->response?->status(),
                'body' => $exception->response?->json(),
            ]);

            return $this->markConnection($connection, AdPlatformConnectionStatus::ProvisioningFailed, [
                'reason' => 'api_error',
                'message' => data_get($exception->response?->json(), 'error.message', $exception->getMessage()),
            ]);
        } catch (RuntimeException $exception) {
            return $this->markConnection($connection, AdPlatformConnectionStatus::ProvisioningFailed, [
                'reason' => 'provisioning_error',
                'message' => $exception->getMessage(),
            ]);
        }

        return $this->markConnection(
            $connection,
            AdPlatformConnectionStatus::Connected,
            [
                'reason' => null,
                'message' => null,
                'page_id' => $this->pageId(),
            ],
            $adAccount['id'],
            $adAccount['name'],
        );
    }

    public function facebookAccountHasAdsScope(CompanyFacebookAccount $facebookAccount): bool
    {
        $scopes = $facebookAccount->scopes ?? [];

        return in_array(self::ADS_MANAGEMENT_SCOPE, $scopes, true);
    }

    /**
     * @param  array{
     *     name: string,
     *     final_url: string,
     *     daily_budget: float|int,
     *     headlines: array<int, string>,
     *     descriptions: array<int, string>,
     * }  $data
     */
    public function createTrafficCampaign(Company $company, array $data): AdCampaign
    {
        $connection = $company->metaAdsConnection()->first();

        if ($connection === null || ! $connection->isReadyForCampaigns()) {
            throw new RuntimeException('Connect Meta Ads before creating campaigns.');
        }

        if (! $this->isConfigured()) {
            throw new RuntimeException('Meta Ads manager credentials are not configured.');
        }

        app(PromotionBudgetService::class)->assertCanFundDailyBudget(
            $company,
            (float) $data['daily_budget'],
        );

        $adAccountId = $this->normalizeAdAccountId((string) $connection->external_account_id);
        $campaignName = $data['name'];
        $headline = $data['headlines'][0] ?? $campaignName;
        $message = $data['descriptions'][0] ?? '';
        $pageId = (string) data_get($connection->meta, 'page_id', $this->pageId());

        try {
            $campaignId = $this->graphPost("/act_{$adAccountId}/campaigns", [
                'name' => $campaignName,
                'objective' => 'OUTCOME_TRAFFIC',
                'status' => 'ACTIVE',
                'special_ad_categories' => '[]',
                'is_adset_budget_sharing_enabled' => false,
            ])->json('id');

            $adSetId = $this->graphPost("/act_{$adAccountId}/adsets", [
                'name' => "{$campaignName} Ad Set",
                'campaign_id' => $campaignId,
                'daily_budget' => (string) (int) round((float) $data['daily_budget']),
                'billing_event' => 'IMPRESSIONS',
                'optimization_goal' => 'LINK_CLICKS',
                'bid_strategy' => 'LOWEST_COST_WITHOUT_CAP',
                'targeting' => json_encode([
                    'geo_locations' => ['countries' => ['ID']],
                ]),
                'status' => 'ACTIVE',
            ])->json('id');

            $creativeId = $this->graphPost("/act_{$adAccountId}/adcreatives", [
                'name' => "{$campaignName} Creative",
                'object_story_spec' => json_encode([
                    'page_id' => $pageId,
                    'link_data' => [
                        'link' => $data['final_url'],
                        'message' => $message,
                        'name' => $headline,
                    ],
                ]),
            ])->json('id');

            $adId = $this->graphPost("/act_{$adAccountId}/ads", [
                'name' => "{$campaignName} Ad",
                'adset_id' => $adSetId,
                'creative' => json_encode(['creative_id' => $creativeId]),
                'status' => 'ACTIVE',
            ])->json('id');
        } catch (RequestException $exception) {
            Log::warning('Meta Ads campaign creation failed', [
                'company_id' => $company->id,
                'body' => $exception->response?->json(),
            ]);

            throw new RuntimeException(
                data_get($exception->response?->json(), 'error.message', 'Failed to create Meta Ads campaign.'),
            );
        }

        if (! is_string($campaignId) || $campaignId === '') {
            throw new RuntimeException('Meta Ads API returned an invalid campaign id.');
        }

        return AdCampaign::query()->create([
            'company_id' => $company->id,
            'ad_platform_connection_id' => $connection->id,
            'platform' => AdPlatform::Meta,
            'status' => AdCampaignStatus::Active,
            'name' => $campaignName,
            'external_campaign_id' => $campaignId,
            'external_budget_id' => is_string($adSetId) ? $adSetId : null,
            'daily_budget' => $data['daily_budget'],
            'final_url' => $data['final_url'],
            'targeting' => [
                'countries' => ['ID'],
            ],
            'creatives' => [
                'headlines' => $data['headlines'],
                'descriptions' => $data['descriptions'],
                'ad_id' => $adId,
                'creative_id' => $creativeId,
            ],
            'meta' => [
                'synced_spend' => 0,
                'ad_account_id' => $adAccountId,
                'page_id' => $pageId,
            ],
        ]);
    }

    public function pauseCampaign(AdCampaign $campaign): AdCampaign
    {
        if ($campaign->platform !== AdPlatform::Meta || ! filled($campaign->external_campaign_id)) {
            throw new RuntimeException('Campaign cannot be paused.');
        }

        if ($this->isConfigured()) {
            $this->graphPost("/{$campaign->external_campaign_id}", [
                'status' => 'PAUSED',
            ])->throw();
        }

        $campaign->update([
            'status' => AdCampaignStatus::Paused,
            'paused_at' => now(),
        ]);

        return $campaign->fresh();
    }

    public function syncSpendForCompany(Company $company): void
    {
        if (! $this->isConfigured()) {
            return;
        }

        $connection = $company->metaAdsConnection()->first();

        if ($connection === null || ! $connection->isReadyForCampaigns()) {
            return;
        }

        $budgetService = app(PromotionBudgetService::class);

        $campaigns = $company->adCampaigns()
            ->where('platform', AdPlatform::Meta)
            ->whereIn('status', [AdCampaignStatus::Active, AdCampaignStatus::Paused])
            ->whereNotNull('external_campaign_id')
            ->get();

        foreach ($campaigns as $campaign) {
            $this->syncCampaignSpend($company, $campaign, $budgetService);
        }

        if ($budgetService->shouldPauseCampaigns($company)) {
            $company->adCampaigns()
                ->where('platform', AdPlatform::Meta)
                ->where('status', AdCampaignStatus::Active)
                ->each(fn (AdCampaign $campaign) => $this->pauseCampaign($campaign));
        }
    }

    public function defaultLandingPageUrl(Company $company): ?string
    {
        return app(GoogleAdsService::class)->defaultLandingPageUrl($company);
    }

    /**
     * @return array{
     *     status: string,
     *     external_account_id: string|null,
     *     external_account_name: string|null,
     *     provisioned_at: string|null,
     *     meta: array<string, mixed>,
     * }|null
     */
    public function connectionSummary(Company $company): ?array
    {
        $connection = $company->metaAdsConnection()->first();

        if ($connection === null) {
            return null;
        }

        return [
            'status' => $connection->status->value,
            'external_account_id' => $connection->external_account_id,
            'external_account_name' => $connection->external_account_name,
            'provisioned_at' => $connection->provisioned_at?->toISOString(),
            'meta' => $connection->meta ?? [],
        ];
    }

    private function syncCampaignSpend(
        Company $company,
        AdCampaign $campaign,
        PromotionBudgetService $budgetService,
    ): void {
        try {
            $response = $this->graphGet("/{$campaign->external_campaign_id}/insights", [
                'fields' => 'spend',
                'date_preset' => 'maximum',
            ]);
        } catch (RequestException $exception) {
            Log::warning('Meta Ads spend sync failed', [
                'campaign_id' => $campaign->id,
                'body' => $exception->response?->json(),
            ]);

            return;
        }

        $totalSpend = (float) data_get($response[0] ?? [], 'spend', 0);
        $previousSpend = (float) data_get($campaign->meta, 'synced_spend', 0);
        $delta = max(0, $totalSpend - $previousSpend);

        if ($delta <= 0) {
            return;
        }

        $adAccountId = (string) data_get($campaign->meta, 'ad_account_id', '');
        $idempotencyKey = sprintf(
            'meta-spend:%s:%s:%s',
            $adAccountId,
            $campaign->external_campaign_id,
            number_format($totalSpend, 2, '.', ''),
        );

        $budgetService->recordSpend(
            $company,
            AdPlatform::Meta,
            $delta,
            $campaign,
            "Meta Ads spend — {$campaign->name}",
            $idempotencyKey,
        );

        $campaign->update([
            'meta' => array_merge($campaign->meta ?? [], [
                'synced_spend' => $totalSpend,
                'last_spend_sync_at' => now()->toISOString(),
            ]),
        ]);
    }

    /**
     * @return array{id: string, name: string}
     */
    private function createAdAccount(Company $company): array
    {
        $response = $this->graphPost("/{$this->businessId()}/adaccount", [
            'name' => sprintf('TravelBoost - %s', $company->name),
            'currency' => config('services.facebook.ads.default_currency', 'IDR'),
            'timezone_id' => self::JAKARTA_TIMEZONE_ID,
            'end_advertiser' => $this->businessId(),
            'media_agency' => 'NONE',
            'partner' => 'NONE',
        ]);

        $accountId = $response->json('account_id') ?? $response->json('id');

        if (! is_string($accountId) || $accountId === '') {
            throw new RuntimeException('Meta Ads API returned an invalid ad account id.');
        }

        return [
            'id' => $this->normalizeAdAccountId($accountId),
            'name' => sprintf('TravelBoost - %s', $company->name),
        ];
    }

    /**
     * @param  array<string, mixed>  $params
     */
    private function graphPost(string $path, array $params): Response
    {
        return Http::asForm()
            ->post($this->graphUrl($path), [
                ...$params,
                'access_token' => $this->platformAccessToken(),
            ])
            ->throw();
    }

    /**
     * @param  array<string, mixed>  $query
     * @return array<int, array<string, mixed>>
     */
    private function graphGet(string $path, array $query = []): array
    {
        $response = Http::acceptJson()
            ->get($this->graphUrl($path), [
                ...$query,
                'access_token' => $this->platformAccessToken(),
            ])
            ->throw()
            ->json();

        return $response['data'] ?? [];
    }

    private function graphUrl(string $path): string
    {
        $normalizedPath = str_starts_with($path, '/') ? $path : "/{$path}";

        return 'https://graph.facebook.com/'.self::GRAPH_API_VERSION.$normalizedPath;
    }

    private function normalizeAdAccountId(string $accountId): string
    {
        return str_starts_with($accountId, 'act_')
            ? substr($accountId, 4)
            : $accountId;
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function markConnection(
        AdPlatformConnection $connection,
        AdPlatformConnectionStatus $status,
        array $meta,
        ?string $externalAccountId = null,
        ?string $externalAccountName = null,
    ): AdPlatformConnection {
        $connection->update([
            'status' => $status,
            'external_account_id' => $externalAccountId ?? $connection->external_account_id,
            'external_account_name' => $externalAccountName ?? $connection->external_account_name,
            'provisioned_at' => $status === AdPlatformConnectionStatus::Connected ? now() : null,
            'meta' => array_merge($connection->meta ?? [], $meta),
        ]);

        return $connection->fresh();
    }

    private function businessId(): ?string
    {
        return config('services.facebook.ads.business_id');
    }

    private function platformAccessToken(): ?string
    {
        return config('services.facebook.ads.access_token');
    }

    private function pageId(): ?string
    {
        return config('services.facebook.ads.page_id');
    }
}
