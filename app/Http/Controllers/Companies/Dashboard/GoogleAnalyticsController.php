<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyGoogleAccount;
use Google\Analytics\Admin\V1beta\Account;
use Google\Analytics\Admin\V1beta\Client\AnalyticsAdminServiceClient;
use Google\Analytics\Admin\V1beta\ListAccountsRequest;
use Google\Analytics\Admin\V1beta\ListDataStreamsRequest;
use Google\Analytics\Admin\V1beta\ListPropertiesRequest;
use Google\Analytics\Admin\V1beta\ProvisionAccountTicketRequest;
use Google\Analytics\Data\V1beta\Client\BetaAnalyticsDataClient;
use Google\ApiCore\ApiException;
use Google\Auth\Credentials\UserRefreshCredentials;
use Google\Client;
use Google\Service\GoogleAnalyticsAdmin;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStream;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;

class GoogleAnalyticsController extends Controller
{
    public function index(Request $request, Company $company)
    {
        $account = $company->googleAccount;
        $analytics = $account?->analyticsConnection;

        $insights = null;

        if ($account && $analytics) {
            $insights = Cache::remember(
                sprintf(
                    'ga-dashboard:%s:%s:30d',
                    $analytics->property_id,
                    $analytics->data_stream_id
                ),
                now()->addHour(),
                fn () => $this->getAnalyticsDashboardInsights(
                    $account,
                    $analytics->property_id,
                    $analytics->data_stream_id
                )
            );
        }

        return Inertia::render(
            'companies/dashboard/google-analytics/index',
            [
                'account' => $account,
                'analytics' => $analytics,
                'insights' => $insights,
            ]
        );
    }

    public function showAccountSetupOrSelections(Request $request, Company $company)
    {
        $existing = $company->googleAccount->analyticsConnection;
        if ($existing != null) {
            return redirect('/');
        } // redirect to list
        $accounts = Cache::remember(
            "google-analytics-accounts:{$company->id}",
            now()->addHour(),
            fn () => $this->getAvailableAnalyticsAccounts($company)
        );

        return Inertia::render('companies/dashboard/google-analytics/select-or-setup-account', [
            'accounts' => $accounts,
        ]);
    }

    public function selectAccount(Request $request, Company $company)
    {
        $validated = $request->validate([
            'company_google_account_id' => [
                'required',
                'integer',
                'exists:company_google_accounts,id',
            ],

            'ga_account_id' => [
                'required',
                'digits_between:1,20',
            ],

            'property_id' => [
                'required',
                'digits_between:1,20',
            ],

            'data_stream_id' => [
                'required',
                'digits_between:1,20',
            ],

            'measurement_id' => [
                'required',
                'string',
                'regex:/^G-[A-Z0-9]+$/',
                'max:20',
            ],

            'website_url' => [
                'nullable',
                'url:https',
                'max:2048',
            ],

            'timezone' => [
                'required',
                'string',
                'max:100',
            ],

            'currency' => [
                'required',
                'string',
                'size:3',
            ],
        ]);
        $created = $company->googleAccount->analyticsConnection->create($validated);

        return back();
    }

    private function getAvailableAnalyticsAccounts(Company $company): array
    {
        $google = $company->googleAccount;

        if (! $google || ! $google->refresh_token) {
            return [];
        }

        $scope = 'https://googleapis.com';

        $auth = new UserRefreshCredentials($scope, [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $google->refresh_token,
        ]);

        $adminClient = new AnalyticsAdminServiceClient([
            'credentials' => $auth,
        ]);

        try {
            $accounts = [];

            foreach ($adminClient->listAccounts(new ListAccountsRequest) as $account) {
                $accounts[] = [
                    'id' => basename($account->getName()),
                    'resource' => $account->getName(),
                    'display_name' => $account->getDisplayName(),
                    'region_code' => $account->getRegionCode(),
                    'properties' => $this->getAnalyticsProperties(
                        $adminClient,
                        $account->getName()
                    ),
                ];
            }

            return $accounts;
        } catch (\Throwable $e) {
            \Log::error(
                'Failed fetching Google Analytics accounts for Company ID '.$company->id,
                ['exception' => $e]
            );

            return [];
        }
    }

    private function getAnalyticsProperties(
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
                    'streams' => $this->getAnalyticsStreams(
                        $adminClient,
                        $property->getName()
                    ),
                ];
            }
        } catch (\Throwable $e) {
            \Log::warning(
                'Failed fetching properties for account '.$accountResource,
                ['exception' => $e]
            );
        }

        return $properties;
    }

    private function getAnalyticsStreams(
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

                    // null untuk Android/iOS stream
                    'measurement_id' => $webStream?->getMeasurementId(),

                    'default_uri' => $webStream?->getDefaultUri(),
                ];
            }
        } catch (\Throwable $e) {
            \Log::warning(
                'Failed fetching streams for property '.$propertyResource,
                ['exception' => $e]
            );
        }

        return $streams;
    }

    public function setupAccount(Request $request, Company $company)
    {
        $google = $company->googleAccount;
        // 1. Fix: Use correct explicit scope for account generation
        $scope = 'https://www.googleapis.com/auth/analytics.edit';

        // 2. Fix: Wrapped client_secret correctly inside the config() helper
        $auth = new UserRefreshCredentials(
            $scope,
            [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'refresh_token' => $google->refresh_token,
            ]
        );

        // 3. Initialize the Client with the auth context
        $adminClient = new AnalyticsAdminServiceClient([
            'credentials' => $auth,
        ]);

        try {
            // 4. Construct the Account layout template
            $accountTemplate = new Account;
            $accountTemplate->setDisplayName('Blog Platform Analytics');
            $accountTemplate->setRegionCode('US');

            // 5. Fix: Renamed variable to avoid overwriting Laravel's $request
            $ticketRequest = new ProvisionAccountTicketRequest;
            $ticketRequest->setAccount($accountTemplate);
            $ticketRequest->setRedirectUri(url()->current());

            // 6. Execute the API call
            $response = $adminClient->provisionAccountTicket($ticketRequest);

            // 7. Extract the unique Google UI onboarding URL
            $onboardingUrl = $response->getUri();

            // 8. Fix: Use Laravel's built-in redirect instead of manual PHP headers
            return redirect()->away($onboardingUrl);

        } catch (ApiException $e) {
            // Catch specific Google API errors for cleaner debugging
            return response()->json(['error' => 'Google API Exception: '.$e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => 'General System Error: '.$e->getMessage()], 500);
        }
    }

    public function createAnalyticsCallback()
    {
        // Inside your /dashboard/analytics-callback route file:

        if (isset($_GET['accountTicketId'])) {
            $ticketId = $_GET['accountTicketId'];

            // 1. Re-initialize your AnalyticsAdminServiceClient (same as Step 2)
            // 2. Use $adminClient->listAccountSummaries() or $adminClient->listAccounts()
            //    to query the user's newly initialized profile.

            // 3. Locate the newest Account ID/Property ID, store them securely
            //    in your database alongside their new G-XXXXXXXXXX Measurement ID.

            // 4. Redirect the user back to their blog settings screen with a success message!
        }
    }

    public function redirect(Request $request)
    {
        return Socialite::driver('google')
            ->scopes([
                'https://www.googleapis.com/auth/analytics.readonly',
                'https://www.googleapis.com/auth/analytics.edit',
            ])
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent',
            ])
            ->redirect();
    }

    public function callback(Request $request)
    {
        $googleUser = Socialite::driver('google')->user();

        $company = $request->user()->company;

        CompanyGoogleAccount::updateOrCreate(
            [
                'company_id' => $company->id,
            ],
            [
                'google_id' => $googleUser->id,
                'email' => $googleUser->email,
                'name' => $googleUser->name,
                'access_token' => $googleUser->token,
                'refresh_token' => $googleUser->refreshToken,
            ]
        );

        return redirect()
            ->route('settings.integrations')
            ->with('success', 'Google Analytics connected.');
    }

    public function setup(Request $request)
    {
        $company = $request->user()->company;
        $connection = $company->googleConnection;

        // 1. Google Client
        $client = new Client;
        $client->setAccessToken($connection->access_token);

        $admin = new GoogleAnalyticsAdmin($client);

        // -----------------------------
        // 2. You need GA Account ID first
        // (simplified: assume user already has account)
        // Example format: accounts/123456
        // -----------------------------
        $accountId = $request->input('account_id');

        // -----------------------------
        // 3. CREATE GA4 PROPERTY
        // -----------------------------
        $property = new GoogleAnalyticsAdminV1betaProperty([
            'parent' => "accounts/{$accountId}",
            'displayName' => $company->name,
            'timeZone' => 'Asia/Jakarta',
            'currencyCode' => 'IDR',
        ]);

        $createdProperty = $admin->properties->create($property);

        $propertyName = $createdProperty->getName();
        // e.g. properties/123456789

        // -----------------------------
        // 4. CREATE WEB STREAM
        // -----------------------------
        $stream = new GoogleAnalyticsAdminV1betaDataStream([
            'displayName' => $company->name.' Web',
            'webStreamData' => [
                'defaultUri' => $request->input('website_url'),
            ],
        ]);

        $createdStream = $admin->properties_dataStreams->create(
            $propertyName,
            $stream
        );

        // measurement ID: G-XXXX
        $measurementId = $createdStream->getWebStreamData()->getMeasurementId();

        // -----------------------------
        // 5. SAVE TO DB
        // -----------------------------
        $connection->update([
            'property_id' => $propertyName,
            'measurement_id' => $measurementId,
        ]);

        return response()->json([
            'property_id' => $propertyName,
            'measurement_id' => $measurementId,
        ]);
    }

    private function getAnalyticsDashboardInsights(
        CompanyGoogleAccount $googleAccount,
        string $propertyId,
        ?string $streamId = null
    ): array {
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

        if (! $row) {
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
            ->filter(function ($row) use ($socialSources) {
                return in_array(
                    strtolower($row['dimensions'][0]),
                    $socialSources,
                    true
                );
            })
            ->map(fn ($row) => [
                'name' => $row['dimensions'][0],
                'sessions' => (int) $row['metrics'][0],
            ])
            ->values()
            ->all();

        return $this->addPercentages($items, 'sessions');
    }

    private function addPercentages(
        array $items,
        string $valueKey
    ): array {
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

    private function runReport(
        CompanyGoogleAccount $googleAccount,
        string $propertyId,
        ?string $streamId,
        array $dimensions,
        array $metrics,
        int $limit = 100
    ): array {
        $client = $this->makeAnalyticsClient($googleAccount);

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
                    ->map(fn ($v) => $v->getValue())
                    ->all(),

                'metrics' => collect($row->getMetricValues())
                    ->map(fn ($v) => $v->getValue())
                    ->all(),
            ])
            ->all();
    }

    private function makeAnalyticsClient(
        CompanyGoogleAccount $googleAccount
    ): BetaAnalyticsDataClient {
        $auth = new UserRefreshCredentials(
            'https://googleapis.com',
            [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'refresh_token' => $googleAccount->refresh_token,
            ]
        );

        return new BetaAnalyticsDataClient([
            'credentials' => $auth,
        ]);
    }
}
