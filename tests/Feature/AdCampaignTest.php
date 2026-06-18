<?php

use App\Enums\AdCampaignStatus;
use App\Enums\AdPlatform;
use App\Enums\AdPlatformConnectionStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Models\AdCampaign;
use App\Models\AdPlatformConnection;
use App\Models\Company;
use App\Models\CompanyFacebookAccount;
use App\Models\CompanyGoogleAccount;
use App\Models\CompanyTeam;
use App\Models\PromotionBudget;
use App\Models\User;
use App\Services\GoogleAdsService;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    config([
        'services.google.client_id' => 'google-client',
        'services.google.client_secret' => 'google-secret',
        'services.google.ads.developer_token' => 'developer-token',
        'services.google.ads.login_customer_id' => '1234567890',
        'services.google.ads.refresh_token' => 'manager-refresh-token',
        'travelboost.marketing.google_ads_enabled' => true,
        'travelboost.marketing.meta_ads_enabled' => true,
    ]);

    $this->owner = User::factory()->create(['status' => UserStatus::ACTIVE]);

    $this->company = Company::factory()->create([
        'type' => CompanyType::AGENT,
        'username' => 'ad-campaign-company',
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

    $googleAccount = CompanyGoogleAccount::create([
        'company_id' => $this->company->id,
        'google_id' => 'google-user-campaigns',
        'email' => 'campaigns@example.com',
        'name' => 'Campaign User',
        'access_token' => 'token',
        'refresh_token' => 'refresh',
        'scopes' => ['https://www.googleapis.com/auth/adwords'],
    ]);

    $this->connection = AdPlatformConnection::query()->create([
        'company_id' => $this->company->id,
        'platform' => AdPlatform::Google,
        'status' => AdPlatformConnectionStatus::Connected,
        'external_account_id' => '9876543210',
        'oauth_account_type' => $googleAccount->getMorphClass(),
        'oauth_account_id' => $googleAccount->id,
        'provisioned_at' => now(),
    ]);

    PromotionBudget::query()->where('company_id', $this->company->id)->update([
        'balance' => 1_000_000,
    ]);
});

test('agent can view campaigns page', function () {
    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/marketing/campaigns",
    );

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/marketing/campaigns/index')
            ->has('campaigns')
            ->where('adCampaignsEnabled', true)
            ->where('googleAdsReady', true));
});

test('campaigns page shows coming soon when ad platforms are disabled', function () {
    config([
        'travelboost.marketing.google_ads_enabled' => false,
        'travelboost.marketing.meta_ads_enabled' => false,
    ]);

    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/marketing/campaigns",
    );

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/marketing/campaigns/index')
            ->where('adCampaignsEnabled', false));
});

test('agent can view create campaign page when google ads is not ready', function () {
    $this->connection->delete();

    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/marketing/campaigns/create",
    );

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/marketing/campaigns/create')
            ->where('googleAdsReady', false)
            ->has('googleAdsConfigured'));
});

test('agent can view create campaign page when google ads is ready', function () {
    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/marketing/campaigns/create",
    );

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/marketing/campaigns/create')
            ->where('googleAdsReady', true));
});

test('campaign creation is blocked when promotion budget is insufficient', function () {
    PromotionBudget::query()->where('company_id', $this->company->id)->update([
        'balance' => 10_000,
    ]);

    $response = $this->actingAs($this->owner)->post(
        "/companies/{$this->company->username}/dashboard/marketing/campaigns",
        [
            'platform' => 'google',
            'name' => 'Bali Tours',
            'final_url' => 'https://example.com',
            'daily_budget' => 100_000,
            'headlines' => ['Tour A', 'Tour B', 'Tour C'],
            'descriptions' => ['Book now', 'Best deals'],
        ],
    );

    $response->assertRedirect()
        ->assertSessionHas('error');

    expect(AdCampaign::query()->count())->toBe(0);
});

test('google performance max campaign can be created when configured', function () {
    Http::fake(function ($request) {
        if (str_contains($request->url(), 'oauth2.googleapis.com')) {
            return Http::response([
                'access_token' => 'manager-access-token',
                'expires_in' => 3600,
            ]);
        }

        if (str_contains($request->url(), 'googleads.googleapis.com') && str_contains($request->url(), 'mutate')) {
            return Http::response([
                'mutateOperationResponses' => [
                    ['campaignBudgetResult' => ['resourceName' => 'customers/9876543210/campaignBudgets/111']],
                    ['campaignResult' => ['resourceName' => 'customers/9876543210/campaigns/222']],
                ],
            ]);
        }

        return Http::response([], 404);
    });

    $response = $this->actingAs($this->owner)->post(
        "/companies/{$this->company->username}/dashboard/marketing/campaigns",
        [
            'platform' => 'google',
            'name' => 'Bali Tours',
            'final_url' => 'https://bali.example.com',
            'daily_budget' => 100_000,
            'headlines' => ['Tour A', 'Tour B', 'Tour C'],
            'descriptions' => ['Book now', 'Best deals'],
        ],
    );

    $response->assertRedirect("/companies/{$this->company->username}/dashboard/marketing/campaigns");

    $campaign = AdCampaign::query()->first();

    expect($campaign)->not->toBeNull()
        ->and($campaign->status)->toBe(AdCampaignStatus::Active)
        ->and($campaign->external_campaign_id)->toBe('222')
        ->and($campaign->external_budget_id)->toBe('111');
});

test('spend sync deducts promotion budget and pauses campaigns when balance is low', function () {
    Http::fake(function ($request) {
        if (str_contains($request->url(), 'oauth2.googleapis.com')) {
            return Http::response(['access_token' => 'token', 'expires_in' => 3600]);
        }

        if (str_contains($request->url(), 'googleAds:search')) {
            return Http::response([
                'results' => [
                    ['metrics' => ['costMicros' => '150000000']],
                ],
            ]);
        }

        if (str_contains($request->url(), 'googleAds:mutate')) {
            return Http::response(['mutateOperationResponses' => []]);
        }

        return Http::response([], 404);
    });

    PromotionBudget::query()->where('company_id', $this->company->id)->update([
        'balance' => 100,
    ]);

    $campaign = AdCampaign::query()->create([
        'company_id' => $this->company->id,
        'ad_platform_connection_id' => $this->connection->id,
        'platform' => AdPlatform::Google,
        'status' => AdCampaignStatus::Active,
        'name' => 'Low Budget Campaign',
        'external_campaign_id' => '222',
        'daily_budget' => 200_000,
        'final_url' => 'https://example.com',
        'meta' => [
            'customer_id' => '9876543210',
            'synced_cost_micros' => 0,
        ],
    ]);

    app(GoogleAdsService::class)->syncSpendForCompany($this->company->fresh());

    expect((float) $this->company->promotionBudget()->first()->balance)->toBe(0.0)
        ->and($campaign->fresh()->status)->toBe(AdCampaignStatus::Paused);
});

test('meta traffic campaign can be created when configured', function () {
    config([
        'services.facebook.ads.business_id' => '123456789',
        'services.facebook.ads.access_token' => 'platform-token',
        'services.facebook.ads.page_id' => '987654321',
    ]);

    $facebookAccount = CompanyFacebookAccount::create([
        'company_id' => $this->company->id,
        'facebook_id' => 'meta-user',
        'email' => 'meta@example.com',
        'name' => 'Meta User',
        'access_token' => 'token',
        'scopes' => ['ads_management'],
    ]);

    AdPlatformConnection::query()->create([
        'company_id' => $this->company->id,
        'platform' => AdPlatform::Meta,
        'status' => AdPlatformConnectionStatus::Connected,
        'external_account_id' => '555666777',
        'oauth_account_type' => $facebookAccount->getMorphClass(),
        'oauth_account_id' => $facebookAccount->id,
        'provisioned_at' => now(),
        'meta' => ['page_id' => '987654321'],
    ]);

    Http::fake(function ($request) {
        if (str_contains($request->url(), 'graph.facebook.com')) {
            if (str_contains($request->url(), '/adcreatives')) {
                return Http::response(['id' => 'meta-creative-333']);
            }

            if (str_contains($request->url(), '/adsets')) {
                return Http::response(['id' => 'meta-adset-222']);
            }

            if (str_contains($request->url(), '/campaigns')) {
                return Http::response(['id' => 'meta-campaign-111']);
            }

            if (preg_match('#/ads$#', parse_url($request->url(), PHP_URL_PATH) ?? '')) {
                return Http::response(['id' => 'meta-ad-444']);
            }
        }

        return Http::response([], 404);
    });

    $response = $this->actingAs($this->owner)->post(
        "/companies/{$this->company->username}/dashboard/marketing/campaigns",
        [
            'platform' => 'meta',
            'name' => 'Bali Meta Tours',
            'final_url' => 'https://bali.example.com',
            'daily_budget' => 100_000,
            'headlines' => ['Tour A'],
            'descriptions' => ['Book now'],
        ],
    );

    $response->assertRedirect("/companies/{$this->company->username}/dashboard/marketing/campaigns");

    $campaign = AdCampaign::query()->where('platform', AdPlatform::Meta)->first();

    expect($campaign)->not->toBeNull()
        ->and($campaign->status)->toBe(AdCampaignStatus::Active)
        ->and($campaign->external_campaign_id)->toBe('meta-campaign-111')
        ->and($campaign->external_budget_id)->toBe('meta-adset-222');
});
