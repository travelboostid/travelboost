<?php

namespace App\Services;

use App\Contracts\AdPlatformService;
use App\Enums\AdCampaignStatus;
use App\Enums\AdPlatform;
use App\Enums\AdPlatformConnectionStatus;
use App\Models\AdCampaign;
use App\Models\AdPlatformConnection;
use App\Models\Company;
use App\Models\CompanyGoogleAccount;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class GoogleAdsService implements AdPlatformService
{
    private const string ADWORDS_SCOPE = 'https://www.googleapis.com/auth/adwords';

    private const string INDONESIA_GEO_TARGET = 'geoTargetConstants/2364';

    public function platform(): AdPlatform
    {
        return AdPlatform::Google;
    }

    public function isConfigured(): bool
    {
        return filled($this->developerToken())
            && filled($this->loginCustomerId())
            && filled($this->managerRefreshToken());
    }

    public function connect(Company $company): AdPlatformConnection
    {
        $googleAccount = $company->googleAccount;

        if ($googleAccount === null) {
            throw new RuntimeException('Connect a Google account before enabling Google Ads.');
        }

        if (! $this->googleAccountHasAdsScope($googleAccount)) {
            throw new RuntimeException('Google account is missing the Google Ads OAuth scope.');
        }

        $connection = AdPlatformConnection::query()->updateOrCreate(
            [
                'company_id' => $company->id,
                'platform' => AdPlatform::Google,
            ],
            [
                'oauth_account_type' => $googleAccount->getMorphClass(),
                'oauth_account_id' => $googleAccount->id,
                'status' => AdPlatformConnectionStatus::PendingProvisioning,
                'meta' => [
                    'last_attempt_at' => now()->toISOString(),
                ],
            ]
        );

        return $this->provisionClientAccount($connection->fresh());
    }

    public function disconnect(Company $company): void
    {
        AdPlatformConnection::query()
            ->where('company_id', $company->id)
            ->where('platform', AdPlatform::Google)
            ->delete();
    }

    public function provisionClientAccount(AdPlatformConnection $connection): AdPlatformConnection
    {
        $connection->loadMissing('company');

        if (! $this->isConfigured()) {
            return $this->markConnection($connection, AdPlatformConnectionStatus::PendingPlatformSetup, [
                'reason' => 'platform_not_configured',
                'message' => 'TravelBoost Google Ads manager credentials are not configured yet.',
            ]);
        }

        if ($connection->status === AdPlatformConnectionStatus::Connected
            && filled($connection->external_account_id)) {
            return $connection;
        }

        try {
            $customerId = $this->createClientAccount($connection->company);
        } catch (RequestException $exception) {
            Log::warning('Google Ads client provisioning failed', [
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

        return $this->markConnection($connection, AdPlatformConnectionStatus::Connected, [
            'reason' => null,
            'message' => null,
        ], $customerId, $connection->company->name);
    }

    public function googleAccountHasAdsScope(CompanyGoogleAccount $googleAccount): bool
    {
        $scopes = $googleAccount->scopes ?? [];

        return in_array(self::ADWORDS_SCOPE, $scopes, true);
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
        $connection = $company->adPlatformConnections()
            ->where('platform', AdPlatform::Google)
            ->first();

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

    /**
     * @param  array{
     *     name: string,
     *     final_url: string,
     *     daily_budget: float|int,
     *     headlines: array<int, string>,
     *     descriptions: array<int, string>,
     *     geo_target?: string|null,
     * }  $data
     */
    public function createPerformanceMaxCampaign(Company $company, array $data): AdCampaign
    {
        $connection = $company->googleAdsConnection()->first();

        if ($connection === null || ! $connection->isReadyForCampaigns()) {
            throw new RuntimeException('Connect Google Ads before creating campaigns.');
        }

        if (! $this->isConfigured()) {
            throw new RuntimeException('Google Ads manager credentials are not configured.');
        }

        app(PromotionBudgetService::class)->assertCanFundDailyBudget(
            $company,
            (float) $data['daily_budget'],
        );

        $customerId = (string) $connection->external_account_id;
        $campaignName = $data['name'];
        $budgetMicros = $this->currencyToMicros((float) $data['daily_budget']);
        $geoTarget = $data['geo_target'] ?? self::INDONESIA_GEO_TARGET;

        $operations = [];
        $operations[] = [
            'campaignBudgetOperation' => [
                'create' => [
                    'resourceName' => "customers/{$customerId}/campaignBudgets/-1",
                    'name' => "{$campaignName} Budget",
                    'amountMicros' => (string) $budgetMicros,
                    'deliveryMethod' => 'STANDARD',
                    'explicitlyShared' => false,
                ],
            ],
        ];
        $operations[] = [
            'campaignOperation' => [
                'create' => [
                    'resourceName' => "customers/{$customerId}/campaigns/-2",
                    'name' => $campaignName,
                    'advertisingChannelType' => 'PERFORMANCE_MAX',
                    'status' => 'ENABLED',
                    'campaignBudget' => "customers/{$customerId}/campaignBudgets/-1",
                    'containsEuPoliticalAdvertising' => 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
                    'maximizeConversions' => new \stdClass,
                ],
            ],
        ];
        $operations[] = [
            'campaignCriterionOperation' => [
                'create' => [
                    'campaign' => "customers/{$customerId}/campaigns/-2",
                    'location' => [
                        'geoTargetConstant' => $geoTarget,
                    ],
                ],
            ],
        ];
        $operations[] = [
            'assetGroupOperation' => [
                'create' => [
                    'resourceName' => "customers/{$customerId}/assetGroups/-3",
                    'name' => "{$campaignName} Asset Group",
                    'campaign' => "customers/{$customerId}/campaigns/-2",
                    'finalUrls' => [$data['final_url']],
                    'status' => 'ENABLED',
                ],
            ],
        ];

        $assetIndex = -10;

        foreach ($data['headlines'] as $headline) {
            $operations[] = [
                'assetOperation' => [
                    'create' => [
                        'resourceName' => "customers/{$customerId}/assets/{$assetIndex}",
                        'textAsset' => ['text' => $headline],
                    ],
                ],
            ];
            $operations[] = [
                'assetGroupAssetOperation' => [
                    'create' => [
                        'assetGroup' => "customers/{$customerId}/assetGroups/-3",
                        'asset' => "customers/{$customerId}/assets/{$assetIndex}",
                        'fieldType' => 'HEADLINE',
                    ],
                ],
            ];
            $assetIndex--;
        }

        foreach ($data['descriptions'] as $description) {
            $operations[] = [
                'assetOperation' => [
                    'create' => [
                        'resourceName' => "customers/{$customerId}/assets/{$assetIndex}",
                        'textAsset' => ['text' => $description],
                    ],
                ],
            ];
            $operations[] = [
                'assetGroupAssetOperation' => [
                    'create' => [
                        'assetGroup' => "customers/{$customerId}/assetGroups/-3",
                        'asset' => "customers/{$customerId}/assets/{$assetIndex}",
                        'fieldType' => 'DESCRIPTION',
                    ],
                ],
            ];
            $assetIndex--;
        }

        try {
            $response = $this->googleAdsMutate($customerId, $operations);
        } catch (RequestException $exception) {
            Log::warning('Google Ads campaign creation failed', [
                'company_id' => $company->id,
                'body' => $exception->response?->json(),
            ]);

            throw new RuntimeException(
                data_get($exception->response?->json(), 'error.message', 'Failed to create Google Ads campaign.'),
            );
        }

        $parsed = $this->parseMutateResourceIds($response->json('mutateOperationResponses', []));

        return AdCampaign::query()->create([
            'company_id' => $company->id,
            'ad_platform_connection_id' => $connection->id,
            'platform' => AdPlatform::Google,
            'status' => AdCampaignStatus::Active,
            'name' => $campaignName,
            'external_campaign_id' => $parsed['campaign_id'],
            'external_budget_id' => $parsed['budget_id'],
            'daily_budget' => $data['daily_budget'],
            'final_url' => $data['final_url'],
            'targeting' => [
                'geo_target' => $geoTarget,
            ],
            'creatives' => [
                'headlines' => $data['headlines'],
                'descriptions' => $data['descriptions'],
            ],
            'meta' => [
                'synced_cost_micros' => 0,
                'customer_id' => $customerId,
            ],
        ]);
    }

    public function pauseCampaign(AdCampaign $campaign): AdCampaign
    {
        if ($campaign->platform !== AdPlatform::Google || ! filled($campaign->external_campaign_id)) {
            throw new RuntimeException('Campaign cannot be paused.');
        }

        $customerId = (string) data_get($campaign->meta, 'customer_id');

        if ($customerId === '') {
            throw new RuntimeException('Campaign is missing Google Ads customer metadata.');
        }

        if ($this->isConfigured()) {
            $this->googleAdsMutate($customerId, [
                [
                    'campaignOperation' => [
                        'update' => [
                            'resourceName' => "customers/{$customerId}/campaigns/{$campaign->external_campaign_id}",
                            'status' => 'PAUSED',
                        ],
                        'updateMask' => 'status',
                    ],
                ],
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

        $connection = $company->googleAdsConnection()->first();

        if ($connection === null || ! $connection->isReadyForCampaigns()) {
            return;
        }

        $customerId = (string) $connection->external_account_id;
        $budgetService = app(PromotionBudgetService::class);

        $campaigns = $company->adCampaigns()
            ->where('platform', AdPlatform::Google)
            ->whereIn('status', [AdCampaignStatus::Active, AdCampaignStatus::Paused])
            ->whereNotNull('external_campaign_id')
            ->get();

        foreach ($campaigns as $campaign) {
            $this->syncCampaignSpend($company, $customerId, $campaign, $budgetService);
        }

        if ($budgetService->shouldPauseCampaigns($company)) {
            $company->adCampaigns()
                ->where('platform', AdPlatform::Google)
                ->where('status', AdCampaignStatus::Active)
                ->each(fn (AdCampaign $campaign) => $this->pauseCampaign($campaign));
        }
    }

    public function defaultLandingPageUrl(Company $company): ?string
    {
        $domain = $company->domain;

        if ($domain === null) {
            return null;
        }

        $scheme = parse_url((string) config('app.url'), PHP_URL_SCHEME) ?: 'https';
        $host = env('APP_HOST', parse_url((string) config('app.url'), PHP_URL_HOST));

        if ($domain->domain_enabled && filled($domain->domain)) {
            return "{$scheme}://{$domain->domain}";
        }

        if ($domain->subdomain_enabled && filled($domain->subdomain) && filled($host)) {
            return "{$scheme}://{$domain->subdomain}.{$host}";
        }

        return null;
    }

    private function syncCampaignSpend(
        Company $company,
        string $customerId,
        AdCampaign $campaign,
        PromotionBudgetService $budgetService,
    ): void {
        $campaignId = $campaign->external_campaign_id;

        try {
            $response = $this->googleAdsSearch(
                $customerId,
                "SELECT campaign.id, metrics.cost_micros FROM campaign WHERE campaign.id = {$campaignId}",
            );
        } catch (RequestException $exception) {
            Log::warning('Google Ads spend sync failed', [
                'campaign_id' => $campaign->id,
                'body' => $exception->response?->json(),
            ]);

            return;
        }

        $totalMicros = 0;

        foreach ($response->json('results', []) as $row) {
            $totalMicros += (int) data_get($row, 'metrics.costMicros', 0);
        }

        $previousMicros = (int) data_get($campaign->meta, 'synced_cost_micros', 0);
        $deltaMicros = max(0, $totalMicros - $previousMicros);

        if ($deltaMicros <= 0) {
            return;
        }

        $deltaAmount = $deltaMicros / 1_000_000;
        $idempotencyKey = sprintf(
            'google-spend:%s:%s:%d',
            $customerId,
            $campaignId,
            $totalMicros,
        );

        $budgetService->recordSpend(
            $company,
            AdPlatform::Google,
            $deltaAmount,
            $campaign,
            "Google Ads spend — {$campaign->name}",
            $idempotencyKey,
        );

        $campaign->update([
            'meta' => array_merge($campaign->meta ?? [], [
                'synced_cost_micros' => $totalMicros,
                'last_spend_sync_at' => now()->toISOString(),
            ]),
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $operations
     */
    private function googleAdsMutate(string $customerId, array $operations): Response
    {
        return $this->googleAdsRequest($customerId)
            ->post(
                "https://googleads.googleapis.com/v21/customers/{$customerId}/googleAds:mutate",
                ['mutateOperations' => $operations],
            )
            ->throw();
    }

    private function googleAdsSearch(string $customerId, string $query): Response
    {
        return $this->googleAdsRequest($customerId)
            ->post(
                "https://googleads.googleapis.com/v21/customers/{$customerId}/googleAds:search",
                ['query' => $query],
            )
            ->throw();
    }

    private function googleAdsRequest(string $customerId): PendingRequest
    {
        return Http::withToken($this->managerAccessToken())
            ->withHeaders([
                'developer-token' => $this->developerToken(),
                'login-customer-id' => $this->loginCustomerId(),
            ])
            ->acceptJson();
    }

    private function currencyToMicros(float $amount): int
    {
        return (int) round($amount * 1_000_000);
    }

    /**
     * @param  array<int, array<string, mixed>>  $responses
     * @return array{budget_id: string|null, campaign_id: string|null}
     */
    private function parseMutateResourceIds(array $responses): array
    {
        $budgetId = null;
        $campaignId = null;

        foreach ($responses as $response) {
            $budgetResource = data_get($response, 'campaignBudgetResult.resourceName');
            $campaignResource = data_get($response, 'campaignResult.resourceName');

            if (is_string($budgetResource)) {
                $budgetId = $this->extractResourceId($budgetResource);
            }

            if (is_string($campaignResource)) {
                $campaignId = $this->extractResourceId($campaignResource);
            }
        }

        return [
            'budget_id' => $budgetId,
            'campaign_id' => $campaignId,
        ];
    }

    private function extractResourceId(string $resourceName): string
    {
        $segments = explode('/', $resourceName);

        return (string) end($segments);
    }

    private function createClientAccount(Company $company): string
    {
        $accessToken = $this->managerAccessToken();
        $loginCustomerId = $this->loginCustomerId();

        $response = Http::withToken($accessToken)
            ->withHeaders([
                'developer-token' => $this->developerToken(),
            ])
            ->post(
                sprintf(
                    'https://googleads.googleapis.com/v21/customers/%s/customerClients:mutate',
                    $loginCustomerId,
                ),
                [
                    'operation' => [
                        'create' => [
                            'descriptiveName' => sprintf('TravelBoost - %s', $company->name),
                            'currencyCode' => config('services.google.ads.default_currency', 'IDR'),
                            'timeZone' => config('services.google.ads.default_timezone', 'Asia/Jakarta'),
                        ],
                    ],
                ],
            )
            ->throw();

        $resourceName = data_get($response->json(), 'result.resourceName');

        if (! is_string($resourceName) || ! str_contains($resourceName, 'customers/')) {
            throw new RuntimeException('Google Ads API returned an invalid customer resource name.');
        }

        return str_replace('customers/', '', $resourceName);
    }

    private function managerAccessToken(): string
    {
        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $this->managerRefreshToken(),
            'grant_type' => 'refresh_token',
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Unable to obtain Google Ads manager access token.');
        }

        $accessToken = $response->json('access_token');

        if (! is_string($accessToken)) {
            throw new RuntimeException('Unable to obtain Google Ads manager access token.');
        }

        return $accessToken;
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

    private function developerToken(): ?string
    {
        return config('services.google.ads.developer_token');
    }

    private function loginCustomerId(): ?string
    {
        $customerId = config('services.google.ads.login_customer_id');

        return is_string($customerId) ? str_replace('-', '', $customerId) : null;
    }

    private function managerRefreshToken(): ?string
    {
        return config('services.google.ads.refresh_token');
    }
}
