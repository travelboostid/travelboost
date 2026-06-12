<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanyGoogleAccount;
use App\Models\GoogleAnalyticsConnection;
use Google\Analytics\Admin\V1beta\Account;
use Google\Analytics\Admin\V1beta\Client\AnalyticsAdminServiceClient;
use Google\Analytics\Admin\V1beta\ListAccountsRequest;
use Google\Analytics\Admin\V1beta\ListDataStreamsRequest;
use Google\Analytics\Admin\V1beta\ListPropertiesRequest;
use Google\Analytics\Admin\V1beta\ProvisionAccountTicketRequest;
use Google\Analytics\Data\V1beta\Client\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Filter;
use Google\Analytics\Data\V1beta\Filter\StringFilter;
use Google\Analytics\Data\V1beta\Filter\StringFilter\MatchType;
use Google\Analytics\Data\V1beta\FilterExpression;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\RunRealtimeReportRequest;
use Google\Analytics\Data\V1beta\RunReportRequest;
use Google\Auth\Credentials\UserRefreshCredentials;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class GoogleAnalyticsService
{
    public function accountsCacheKey(Company $company): string
    {
        return "analytics-accounts:{$company->id}";
    }

    public function dashboardCacheKey(GoogleAnalyticsConnection $connection): string
    {
        return sprintf(
            'ga-dashboard:%s:%s:30d',
            $connection->property_id,
            $connection->data_stream_id
        );
    }

    public function realtimeCacheKey(GoogleAnalyticsConnection $connection): string
    {
        return sprintf(
            'ga-realtime-dashboard:%s:live',
            $connection->property_id,
        );
    }

    public function clearCaches(Company $company, ?GoogleAnalyticsConnection $connection = null): void
    {
        Cache::forget($this->accountsCacheKey($company));

        if ($connection === null) {
            return;
        }

        Cache::forget($this->dashboardCacheKey($connection));
        Cache::forget($this->realtimeCacheKey($connection));
    }

    /**
     * @param  array{
     *     company_google_account_id: int,
     *     ga_account_id: string,
     *     property_id: string,
     *     data_stream_id: string,
     *     measurement_id: string,
     *     website_url?: string|null,
     *     timezone?: string|null,
     *     currency?: string|null,
     * }  $data
     */
    public function connectProperty(
        Company $company,
        CompanyGoogleAccount $googleAccount,
        array $data
    ): GoogleAnalyticsConnection {
        $connection = $googleAccount->analyticsConnection()->create([
            'company_google_account_id' => $data['company_google_account_id'],
            'ga_account_id' => $data['ga_account_id'],
            'property_id' => $data['property_id'],
            'data_stream_id' => $data['data_stream_id'],
            'measurement_id' => $data['measurement_id'],
            'website_url' => $data['website_url'] ?? null,
            'timezone' => $data['timezone'] ?? 'Asia/Jakarta',
            'currency' => $data['currency'] ?? 'IDR',
        ]);

        Cache::forget($this->accountsCacheKey($company));

        return $connection;
    }

    public function unlinkProperty(Company $company): void
    {
        $connection = $company->googleAccount?->analyticsConnection;

        if ($connection === null) {
            throw new RuntimeException('No analytics connection to unlink.');
        }

        $this->clearCaches($company, $connection);
        $connection->delete();
    }

    public function disconnectGoogleAccount(Company $company): void
    {
        $googleAccount = $company->googleAccount;

        if ($googleAccount === null) {
            throw new RuntimeException('No Google account to disconnect.');
        }

        $this->clearCaches($company, $googleAccount->analyticsConnection);
        $googleAccount->delete();
    }

    /**
     * @param  object{id: string|int, email?: string, name?: string, token: string, refreshToken?: string|null, approvedScopes?: array<int, string>|null}  $googleUser
     */
    public function upsertGoogleAccount(Company $company, object $googleUser): CompanyGoogleAccount
    {
        $existing = $company->googleAccount;

        if ($existing !== null && (string) $existing->google_id !== (string) $googleUser->id) {
            $this->clearCaches($company, $existing->analyticsConnection);
            $existing->analyticsConnection?->delete();
        }

        return CompanyGoogleAccount::updateOrCreate(
            [
                'company_id' => $company->id,
            ],
            [
                'google_id' => $googleUser->id,
                'email' => $googleUser->email ?? null,
                'name' => $googleUser->name ?? null,
                'access_token' => $googleUser->token,
                'refresh_token' => $googleUser->refreshToken ?? null,
                'scopes' => $googleUser->approvedScopes ?? null,
            ]
        );
    }

    public function provisionAccountTicketUrl(
        CompanyGoogleAccount $googleAccount,
        string $redirectUri
    ): string {
        if ($googleAccount->refresh_token === null) {
            throw new RuntimeException('Google account is missing a refresh token.');
        }

        $adminClient = $this->makeAdminClient(
            $googleAccount,
            'https://www.googleapis.com/auth/analytics.edit'
        );

        $accountTemplate = new Account;
        $accountTemplate->setDisplayName('Blog Platform Analytics');
        $accountTemplate->setRegionCode('US');

        $ticketRequest = new ProvisionAccountTicketRequest;
        $ticketRequest->setAccount($accountTemplate);
        $ticketRequest->setRedirectUri($redirectUri);

        $ticketId = $adminClient->provisionAccountTicket($ticketRequest)->getAccountTicketId();

        return 'https://analytics.google.com/analytics/web/?provisioningSignup=false#/termsofservice/'.$ticketId;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listAvailableAccounts(Company $company): array
    {
        $google = $company->googleAccount;

        if ($google === null || $google->refresh_token === null) {
            return [];
        }

        $adminClient = $this->makeAdminClient($google);

        try {
            $accounts = [];

            foreach ($adminClient->listAccounts(new ListAccountsRequest) as $account) {
                $accounts[] = [
                    'id' => basename($account->getName()),
                    'resource' => $account->getName(),
                    'display_name' => $account->getDisplayName(),
                    'region_code' => $account->getRegionCode(),
                    'properties' => $this->listProperties(
                        $adminClient,
                        $account->getName()
                    ),
                ];
            }

            return $accounts;
        } catch (\Throwable $e) {
            Log::error(
                'Failed fetching Google Analytics accounts for Company ID '.$company->id,
                ['exception' => $e]
            );

            return [];
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function getDashboardInsights(
        CompanyGoogleAccount $googleAccount,
        GoogleAnalyticsConnection $connection
    ): array {
        $propertyId = $connection->property_id;
        $streamId = $connection->data_stream_id;

        return [
            'overview' => $this->getOverviewInsights(
                $googleAccount,
                $propertyId,
                $streamId
            ),
            'devices' => $this->getBreakdownInsights(
                $googleAccount,
                $propertyId,
                $streamId,
                'deviceCategory',
                'activeUsers',
                'users'
            ),
            'channels' => $this->getBreakdownInsights(
                $googleAccount,
                $propertyId,
                $streamId,
                'sessionDefaultChannelGroup',
                'sessions',
                'sessions'
            ),
            'social_sources' => $this->getSocialSourceInsights(
                $googleAccount,
                $propertyId,
                $streamId
            ),
            'countries' => $this->getBreakdownInsights(
                $googleAccount,
                $propertyId,
                $streamId,
                'country',
                'activeUsers',
                'users',
                10
            ),
            'browsers' => $this->getBreakdownInsights(
                $googleAccount,
                $propertyId,
                $streamId,
                'browser',
                'activeUsers',
                'users',
                10
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getRealtimeInsights(
        CompanyGoogleAccount $googleAccount,
        GoogleAnalyticsConnection $connection
    ): array {
        $propertyId = $connection->property_id;

        return [
            'overview' => $this->getRealtimeOverview(
                $googleAccount,
                $propertyId,
            ),
            'devices' => $this->getRealtimeBreakdown(
                $googleAccount,
                $propertyId,
                'deviceCategory',
            ),
            'countries' => $this->getRealtimeBreakdown(
                $googleAccount,
                $propertyId,
                'country',
            ),
            'pages' => $this->getRealtimeBreakdown(
                $googleAccount,
                $propertyId,
                'unifiedScreenName',
                'screenPageViews',
                20
            ),
            'events' => $this->getRealtimeBreakdown(
                $googleAccount,
                $propertyId,
                'eventName',
                'eventCount',
                20
            ),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listProperties(
        AnalyticsAdminServiceClient $adminClient,
        string $accountResource
    ): array {
        $properties = [];

        try {
            $request = (new ListPropertiesRequest)
                ->setFilter('parent:'.$accountResource);

            foreach ($adminClient->listProperties($request) as $property) {
                $properties[] = [
                    'id' => basename($property->getName()),
                    'resource' => $property->getName(),
                    'display_name' => $property->getDisplayName(),
                    'property_type' => $property->getPropertyType(),
                    'industry_category' => $property->getIndustryCategory(),
                    'time_zone' => $property->getTimeZone(),
                    'currency_code' => $property->getCurrencyCode(),
                    'streams' => $this->listStreams(
                        $adminClient,
                        $property->getName()
                    ),
                ];
            }
        } catch (\Throwable $e) {
            Log::warning(
                'Failed fetching properties for account '.$accountResource,
                ['exception' => $e]
            );
        }

        return $properties;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listStreams(
        AnalyticsAdminServiceClient $adminClient,
        string $propertyResource
    ): array {
        $streams = [];

        try {
            $request = (new ListDataStreamsRequest)
                ->setParent($propertyResource);

            foreach ($adminClient->listDataStreams($request) as $stream) {
                $webStream = $stream->getWebStreamData();

                $streams[] = [
                    'id' => basename($stream->getName()),
                    'resource' => $stream->getName(),
                    'display_name' => $stream->getDisplayName(),
                    'type' => $stream->getType(),
                    'measurement_id' => $webStream?->getMeasurementId(),
                    'default_uri' => $webStream?->getDefaultUri(),
                ];
            }
        } catch (\Throwable $e) {
            Log::warning(
                'Failed fetching streams for property '.$propertyResource,
                ['exception' => $e]
            );
        }

        return $streams;
    }

    /**
     * @return array{users: int, sessions: int, page_views: int, bounce_rate: float|int}
     */
    private function getOverviewInsights(
        CompanyGoogleAccount $googleAccount,
        string $propertyId,
        ?string $streamId
    ): array {
        $rows = $this->runReport(
            $googleAccount,
            $propertyId,
            $streamId,
            [],
            [
                'activeUsers',
                'sessions',
                'screenPageViews',
                'bounceRate',
            ]
        );

        $row = $rows[0] ?? null;

        if ($row === null) {
            return [
                'users' => 0,
                'sessions' => 0,
                'page_views' => 0,
                'bounce_rate' => 0,
            ];
        }

        return [
            'users' => (int) $row['metrics'][0],
            'sessions' => (int) $row['metrics'][1],
            'page_views' => (int) $row['metrics'][2],
            'bounce_rate' => round((float) $row['metrics'][3], 1),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getBreakdownInsights(
        CompanyGoogleAccount $googleAccount,
        string $propertyId,
        ?string $streamId,
        string $dimension,
        string $metric,
        string $valueKey,
        int $limit = 20
    ): array {
        $rows = $this->runReport(
            $googleAccount,
            $propertyId,
            $streamId,
            [$dimension],
            [$metric],
            $limit
        );

        $items = collect($rows)
            ->map(fn ($row) => [
                'name' => $row['dimensions'][0],
                $valueKey => (int) $row['metrics'][0],
            ])
            ->values()
            ->all();

        return $this->addPercentages($items, $valueKey);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getSocialSourceInsights(
        CompanyGoogleAccount $googleAccount,
        string $propertyId,
        ?string $streamId
    ): array {
        $rows = $this->runReport(
            $googleAccount,
            $propertyId,
            $streamId,
            ['sessionSource'],
            ['sessions'],
            50
        );

        $socialSources = [
            'facebook',
            'instagram',
            'linkedin',
            'tiktok',
            'twitter',
            'x',
            'youtube',
            'pinterest',
        ];

        $items = collect($rows)
            ->filter(fn ($row) => in_array(
                strtolower($row['dimensions'][0]),
                $socialSources,
                true
            ))
            ->map(fn ($row) => [
                'name' => $row['dimensions'][0],
                'sessions' => (int) $row['metrics'][0],
            ])
            ->values()
            ->all();

        return $this->addPercentages($items, 'sessions');
    }

    /**
     * @return array{active_users: int, events: int, page_views: int}
     */
    private function getRealtimeOverview(
        CompanyGoogleAccount $googleAccount,
        string $propertyId
    ): array {
        $rows = $this->runRealtimeReport(
            $googleAccount,
            $propertyId,
            [],
            [
                'activeUsers',
                'eventCount',
                'screenPageViews',
            ]
        );

        $row = $rows[0] ?? null;

        return [
            'active_users' => (int) ($row['metrics'][0] ?? 0),
            'events' => (int) ($row['metrics'][1] ?? 0),
            'page_views' => (int) ($row['metrics'][2] ?? 0),
        ];
    }

    /**
     * @return array<int, array{name: string, value: int}>
     */
    private function getRealtimeBreakdown(
        CompanyGoogleAccount $googleAccount,
        string $propertyId,
        string $dimension,
        string $metric = 'activeUsers',
        int $limit = 10
    ): array {
        $rows = $this->runRealtimeReport(
            $googleAccount,
            $propertyId,
            [$dimension],
            [$metric],
            $limit
        );

        return collect($rows)
            ->map(fn ($row) => [
                'name' => $row['dimensions'][0] ?? 'unknown',
                'value' => (int) ($row['metrics'][0] ?? 0),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>  $dimensions
     * @param  array<int, string>  $metrics
     * @return array<int, array{dimensions: array<int, string>, metrics: array<int, string>}>
     */
    private function runReport(
        CompanyGoogleAccount $googleAccount,
        string $propertyId,
        ?string $streamId,
        array $dimensions,
        array $metrics,
        int $limit = 100
    ): array {
        $client = $this->makeAnalyticsDataClient($googleAccount);

        $request = $this->buildReportRequest(
            $propertyId,
            $streamId,
            $dimensions,
            $metrics,
            $limit
        );

        $report = $client->runReport($request);

        return collect($report->getRows())
            ->map(fn ($row) => [
                'dimensions' => collect($row->getDimensionValues())
                    ->map(fn ($value) => $value->getValue())
                    ->all(),
                'metrics' => collect($row->getMetricValues())
                    ->map(fn ($value) => $value->getValue())
                    ->all(),
            ])
            ->all();
    }

    /**
     * @param  array<int, string>  $dimensions
     * @param  array<int, string>  $metrics
     * @return array<int, array{dimensions: array<int, string>, metrics: array<int, string>}>
     */
    private function runRealtimeReport(
        CompanyGoogleAccount $googleAccount,
        string $propertyId,
        array $dimensions = [],
        array $metrics = [],
        int $limit = 20
    ): array {
        $client = $this->makeAnalyticsDataClient($googleAccount);

        $response = $client->runRealtimeReport(
            new RunRealtimeReportRequest([
                'property' => "properties/{$propertyId}",
                'dimensions' => collect($dimensions)
                    ->map(fn ($name) => new Dimension(['name' => $name]))
                    ->all(),
                'metrics' => collect($metrics)
                    ->map(fn ($name) => new Metric(['name' => $name]))
                    ->all(),
                'limit' => $limit,
            ])
        );

        return collect($response->getRows())
            ->map(fn ($row) => [
                'dimensions' => collect($row->getDimensionValues())
                    ->map(fn ($value) => $value->getValue())
                    ->all(),
                'metrics' => collect($row->getMetricValues())
                    ->map(fn ($value) => $value->getValue())
                    ->all(),
            ])
            ->all();
    }

    /**
     * @param  array<int, string>  $dimensions
     * @param  array<int, string>  $metrics
     */
    private function buildReportRequest(
        string $propertyId,
        ?string $streamId,
        array $dimensions,
        array $metrics,
        int $limit
    ): RunReportRequest {
        $request = new RunReportRequest;
        $request->setProperty('properties/'.$propertyId);
        $request->setDateRanges([
            new DateRange([
                'start_date' => '30daysAgo',
                'end_date' => 'today',
            ]),
        ]);
        $request->setDimensions(
            array_map(fn ($dimension) => new Dimension(['name' => $dimension]), $dimensions)
        );
        $request->setMetrics(
            array_map(fn ($metric) => new Metric(['name' => $metric]), $metrics)
        );
        $request->setLimit($limit);

        if ($streamId !== null && $streamId !== '') {
            $request->setDimensionFilter(new FilterExpression([
                'filter' => new Filter([
                    'field_name' => 'streamId',
                    'string_filter' => new StringFilter([
                        'match_type' => MatchType::EXACT,
                        'value' => $streamId,
                    ]),
                ]),
            ]));
        }

        return $request;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function addPercentages(array $items, string $valueKey): array
    {
        $total = collect($items)->sum($valueKey);

        return collect($items)
            ->map(function ($item) use ($total, $valueKey) {
                $item['percentage'] = $total > 0
                    ? round(($item[$valueKey] / $total) * 100, 1)
                    : 0;

                return $item;
            })
            ->values()
            ->all();
    }

    private function makeAdminClient(
        CompanyGoogleAccount $googleAccount,
        string $scope = 'https://googleapis.com'
    ): AnalyticsAdminServiceClient {
        if ($googleAccount->refresh_token === null) {
            throw new RuntimeException('Google account is missing a refresh token.');
        }

        return new AnalyticsAdminServiceClient([
            'credentials' => new UserRefreshCredentials($scope, [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'refresh_token' => $googleAccount->refresh_token,
            ]),
        ]);
    }

    private function makeAnalyticsDataClient(
        CompanyGoogleAccount $googleAccount
    ): BetaAnalyticsDataClient {
        if ($googleAccount->refresh_token === null) {
            throw new RuntimeException('Google account is missing a refresh token.');
        }

        return new BetaAnalyticsDataClient([
            'credentials' => new UserRefreshCredentials(
                'https://googleapis.com',
                [
                    'client_id' => config('services.google.client_id'),
                    'client_secret' => config('services.google.client_secret'),
                    'refresh_token' => $googleAccount->refresh_token,
                ]
            ),
        ]);
    }
}
