<?php

use App\Enums\AdPlatform;
use App\Enums\AdPlatformConnectionStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Models\AdPlatformConnection;
use App\Models\Company;
use App\Models\CompanyGoogleAccount;
use App\Models\CompanyTeam;
use App\Models\User;
use App\Services\GoogleAdsService;
use App\Services\LinkedAccountsService;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    config([
        'travelboost.marketing.google_ads_enabled' => true,
    ]);

    $this->owner = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);

    $this->company = Company::factory()->create([
        'type' => CompanyType::AGENT,
        'username' => 'google-ads-company',
    ]);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $this->owner->id,
        'invite_email' => $this->owner->email,
        'invite_role' => "company:{$this->company->id}:superadmin",
        'invited_at' => now(),
        'accepted_at' => now(),
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
    ]);

    $this->owner->addRoles([
        'user:agent',
        "company:{$this->company->id}:superadmin",
    ]);

    $this->googleAccount = CompanyGoogleAccount::create([
        'company_id' => $this->company->id,
        'google_id' => 'google-user-ads',
        'email' => 'ads@example.com',
        'name' => 'Ads User',
        'access_token' => 'token',
        'refresh_token' => 'refresh',
        'scopes' => ['https://www.googleapis.com/auth/adwords'],
    ]);
});

test('google ads connect waits for platform manager credentials when not configured', function () {
    config([
        'services.google.ads.developer_token' => null,
        'services.google.ads.login_customer_id' => null,
        'services.google.ads.refresh_token' => null,
    ]);

    $connection = app(GoogleAdsService::class)->connect($this->company);

    expect($connection->status)->toBe(AdPlatformConnectionStatus::PendingPlatformSetup)
        ->and($connection->platform)->toBe(AdPlatform::Google)
        ->and($connection->external_account_id)->toBeNull()
        ->and(data_get($connection->meta, 'reason'))->toBe('platform_not_configured');
});

test('google ads provisioning creates client account when manager credentials are configured', function () {
    config([
        'services.google.client_id' => 'google-client',
        'services.google.client_secret' => 'google-secret',
        'services.google.ads.developer_token' => 'developer-token',
        'services.google.ads.login_customer_id' => '1234567890',
        'services.google.ads.refresh_token' => 'manager-refresh-token',
    ]);

    Http::fake(function ($request) {
        if (str_contains($request->url(), 'oauth2.googleapis.com')) {
            return Http::response([
                'access_token' => 'manager-access-token',
                'expires_in' => 3600,
            ]);
        }

        if (str_contains($request->url(), 'googleads.googleapis.com')) {
            return Http::response([
                'result' => [
                    'resourceName' => 'customers/9876543210',
                ],
            ]);
        }

        return Http::response([], 404);
    });

    $connection = app(GoogleAdsService::class)->connect($this->company);

    expect($connection->status)->toBe(AdPlatformConnectionStatus::Connected)
        ->and($connection->external_account_id)->toBe('9876543210')
        ->and($connection->provisioned_at)->not->toBeNull();
});

test('google ads disconnect removes platform connection', function () {
    AdPlatformConnection::query()->create([
        'company_id' => $this->company->id,
        'platform' => AdPlatform::Google,
        'status' => AdPlatformConnectionStatus::Connected,
        'external_account_id' => '9876543210',
    ]);

    app(GoogleAdsService::class)->disconnect($this->company);

    expect(AdPlatformConnection::query()->count())->toBe(0);
});

test('linked accounts include google ads integration status', function () {
    AdPlatformConnection::query()->create([
        'company_id' => $this->company->id,
        'platform' => AdPlatform::Google,
        'status' => AdPlatformConnectionStatus::Connected,
        'external_account_id' => '9876543210',
        'oauth_account_type' => $this->googleAccount->getMorphClass(),
        'oauth_account_id' => $this->googleAccount->id,
    ]);

    $groups = app(LinkedAccountsService::class)->getAccountGroups($this->company);
    $googleGroup = collect($groups)->firstWhere('type', 'google');
    $googleAds = collect($googleGroup['accounts'][0]['integrations'])
        ->firstWhere('key', 'google_ads');

    expect($googleAds['status'])->toBe('connected')
        ->and($googleAds['detail'])->toBe('9876543210');
});

test('agent can retry google ads provisioning from promotion budget page', function () {
    config([
        'services.google.ads.developer_token' => null,
    ]);

    AdPlatformConnection::query()->create([
        'company_id' => $this->company->id,
        'platform' => AdPlatform::Google,
        'status' => AdPlatformConnectionStatus::ProvisioningFailed,
        'oauth_account_type' => $this->googleAccount->getMorphClass(),
        'oauth_account_id' => $this->googleAccount->id,
        'meta' => ['message' => 'previous failure'],
    ]);

    $response = $this->actingAs($this->owner)->post(
        "/companies/{$this->company->username}/dashboard/marketing/budget/google/retry-provision",
    );

    $response->assertRedirect("/companies/{$this->company->username}/dashboard/marketing/budget");

    expect($this->company->googleAdsConnection()->first()->status)
        ->toBe(AdPlatformConnectionStatus::PendingPlatformSetup);
});

test('google ads connect is blocked when feature flag is disabled', function () {
    config(['travelboost.marketing.google_ads_enabled' => false]);

    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/google/connect-ads",
    );

    $response->assertRedirect("/companies/{$this->company->username}/dashboard/marketing/budget");
});
