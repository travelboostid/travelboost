<?php

use App\Enums\AdPlatform;
use App\Enums\AdPlatformConnectionStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Models\AdPlatformConnection;
use App\Models\Company;
use App\Models\CompanyFacebookAccount;
use App\Models\CompanyTeam;
use App\Models\User;
use App\Services\LinkedAccountsService;
use App\Services\MetaAdsService;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    config([
        'travelboost.marketing.meta_ads_enabled' => true,
    ]);

    $this->owner = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);

    $this->company = Company::factory()->create([
        'type' => CompanyType::AGENT,
        'username' => 'meta-ads-company',
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

    $this->facebookAccount = CompanyFacebookAccount::create([
        'company_id' => $this->company->id,
        'facebook_id' => 'facebook-user-ads',
        'email' => 'ads@example.com',
        'name' => 'Ads User',
        'access_token' => 'token',
        'scopes' => ['ads_management', 'ads_read', 'business_management'],
    ]);
});

test('meta ads connect waits for platform manager credentials when not configured', function () {
    config([
        'services.facebook.ads.business_id' => null,
        'services.facebook.ads.access_token' => null,
        'services.facebook.ads.page_id' => null,
    ]);

    $connection = app(MetaAdsService::class)->connect($this->company);

    expect($connection->status)->toBe(AdPlatformConnectionStatus::PendingPlatformSetup)
        ->and($connection->platform)->toBe(AdPlatform::Meta)
        ->and($connection->external_account_id)->toBeNull()
        ->and(data_get($connection->meta, 'reason'))->toBe('platform_not_configured');
});

test('meta ads provisioning creates ad account when manager credentials are configured', function () {
    config([
        'services.facebook.ads.business_id' => '123456789',
        'services.facebook.ads.access_token' => 'platform-token',
        'services.facebook.ads.page_id' => '987654321',
    ]);

    Http::fake(function ($request) {
        if (str_contains($request->url(), 'graph.facebook.com')) {
            return Http::response([
                'account_id' => '555666777',
                'id' => 'act_555666777',
            ]);
        }

        return Http::response([], 404);
    });

    $connection = app(MetaAdsService::class)->connect($this->company);

    expect($connection->status)->toBe(AdPlatformConnectionStatus::Connected)
        ->and($connection->external_account_id)->toBe('555666777')
        ->and($connection->provisioned_at)->not->toBeNull();
});

test('meta ads disconnect removes platform connection', function () {
    AdPlatformConnection::query()->create([
        'company_id' => $this->company->id,
        'platform' => AdPlatform::Meta,
        'status' => AdPlatformConnectionStatus::Connected,
        'external_account_id' => '555666777',
    ]);

    app(MetaAdsService::class)->disconnect($this->company);

    expect(AdPlatformConnection::query()->count())->toBe(0);
});

test('linked accounts include meta ads integration status', function () {
    AdPlatformConnection::query()->create([
        'company_id' => $this->company->id,
        'platform' => AdPlatform::Meta,
        'status' => AdPlatformConnectionStatus::Connected,
        'external_account_id' => '555666777',
        'oauth_account_type' => $this->facebookAccount->getMorphClass(),
        'oauth_account_id' => $this->facebookAccount->id,
    ]);

    $groups = app(LinkedAccountsService::class)->getAccountGroups($this->company);
    $metaGroup = collect($groups)->firstWhere('type', 'meta');
    $metaAds = collect($metaGroup['accounts'][0]['integrations'])
        ->firstWhere('key', 'meta_ads');

    expect($metaAds['status'])->toBe('connected')
        ->and($metaAds['detail'])->toBe('555666777');
});

test('agent can retry meta ads provisioning from promotion budget page', function () {
    config([
        'services.facebook.ads.business_id' => null,
    ]);

    AdPlatformConnection::query()->create([
        'company_id' => $this->company->id,
        'platform' => AdPlatform::Meta,
        'status' => AdPlatformConnectionStatus::ProvisioningFailed,
        'oauth_account_type' => $this->facebookAccount->getMorphClass(),
        'oauth_account_id' => $this->facebookAccount->id,
        'meta' => ['message' => 'previous failure'],
    ]);

    $response = $this->actingAs($this->owner)->post(
        "/companies/{$this->company->username}/dashboard/marketing/budget/meta/retry-provision",
    );

    $response->assertRedirect("/companies/{$this->company->username}/dashboard/marketing/budget");

    expect($this->company->metaAdsConnection()->first()->status)
        ->toBe(AdPlatformConnectionStatus::PendingPlatformSetup);
});

test('meta ads connect is blocked when feature flag is disabled', function () {
    config(['travelboost.marketing.meta_ads_enabled' => false]);

    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/facebook/connect-ads",
    );

    $response->assertRedirect("/companies/{$this->company->username}/dashboard/marketing/budget");
});
