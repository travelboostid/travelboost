<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\MetaPixelConnectionSource;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\CompanyFacebookAccount;
use App\Models\CompanyTeam;
use App\Models\MetaPixelConnection;
use App\Models\User;
use App\Services\MetaAnalyticsService;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->owner = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);

    $this->company = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'meta-analytics-company',
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
        'user:vendor',
        "company:{$this->company->id}:superadmin",
    ]);

    $this->facebookAccount = CompanyFacebookAccount::create([
        'company_id' => $this->company->id,
        'facebook_id' => 'facebook-user-123',
        'email' => 'owner@example.com',
        'name' => 'Owner Example',
        'access_token' => 'token',
        'scopes' => ['ads_read', 'business_management'],
    ]);
});

test('company can connect meta pixel via oauth selection', function () {
    $response = $this->actingAs($this->owner)->post(
        "/companies/{$this->company->username}/dashboard/analytics/meta/select-pixel",
        [
            'pixel_id' => '123456789012345',
            'pixel_name' => 'Travelboost Pixel',
            'ad_account_id' => 'act_999',
            'connection_source' => 'oauth',
            'company_facebook_account_id' => $this->facebookAccount->id,
        ],
    );

    $response->assertRedirect("/companies/{$this->company->username}/dashboard/analytics/meta");

    $connection = MetaPixelConnection::query()->first();

    expect($connection)->not->toBeNull()
        ->and($connection->pixel_id)->toBe('123456789012345')
        ->and($connection->pixel_name)->toBe('Travelboost Pixel')
        ->and($connection->connection_source)->toBe(MetaPixelConnectionSource::Oauth);
});

test('company can connect meta pixel manually without facebook account', function () {
    $response = $this->actingAs($this->owner)->post(
        "/companies/{$this->company->username}/dashboard/analytics/meta/select-pixel",
        [
            'pixel_id' => '987654321098765',
            'connection_source' => 'manual',
        ],
    );

    $response->assertRedirect("/companies/{$this->company->username}/dashboard/analytics/meta");

    $connection = MetaPixelConnection::query()->first();

    expect($connection)->not->toBeNull()
        ->and($connection->pixel_id)->toBe('987654321098765')
        ->and($connection->company_facebook_account_id)->toBeNull()
        ->and($connection->connection_source)->toBe(MetaPixelConnectionSource::Manual);
});

test('company can unlink meta pixel connection', function () {
    MetaPixelConnection::create([
        'company_id' => $this->company->id,
        'company_facebook_account_id' => $this->facebookAccount->id,
        'pixel_id' => '123456789012345',
        'connection_source' => MetaPixelConnectionSource::Oauth,
    ]);

    $response = $this->actingAs($this->owner)->delete(
        "/companies/{$this->company->username}/dashboard/analytics/meta/connection",
    );

    $response->assertRedirect(
        "/companies/{$this->company->username}/dashboard/analytics/meta/select-pixel"
    );

    expect(MetaPixelConnection::query()->count())->toBe(0);
});

test('company can disconnect facebook account from linked accounts', function () {
    MetaPixelConnection::create([
        'company_id' => $this->company->id,
        'company_facebook_account_id' => $this->facebookAccount->id,
        'pixel_id' => '123456789012345',
        'connection_source' => MetaPixelConnectionSource::Oauth,
    ]);

    $response = $this->actingAs($this->owner)->delete(
        "/companies/{$this->company->username}/dashboard/facebook/disconnect",
    );

    $response->assertRedirect(
        "/companies/{$this->company->username}/dashboard/linked-accounts"
    );

    expect(CompanyFacebookAccount::query()->count())->toBe(0)
        ->and(MetaPixelConnection::query()->count())->toBe(0);
});

test('linked accounts page shows google and meta account groups', function () {
    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/linked-accounts",
    );

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/linked-accounts/index')
            ->has('accountGroups', 2)
            ->where('accountGroups.1.type', 'meta')
            ->where('accountGroups.1.accounts.0.email', 'owner@example.com')
            ->where('accountGroups.1.accounts.0.integrations.1.status', 'not_connected'));
});

test('linked accounts page shows facebook account and meta pixel integration', function () {
    MetaPixelConnection::create([
        'company_id' => $this->company->id,
        'company_facebook_account_id' => $this->facebookAccount->id,
        'pixel_id' => '123456789012345',
        'pixel_name' => 'Main Pixel',
        'connection_source' => MetaPixelConnectionSource::Oauth,
    ]);

    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/linked-accounts",
    );

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/linked-accounts/index')
            ->where('accountGroups.1.accounts.0.integrations.1.key', 'meta_pixel')
            ->where('accountGroups.1.accounts.0.integrations.1.detail', '123456789012345'));
});

test('meta analytics dashboard renders when pixel is connected', function () {
    MetaPixelConnection::create([
        'company_id' => $this->company->id,
        'company_facebook_account_id' => $this->facebookAccount->id,
        'pixel_id' => '123456789012345',
        'connection_source' => MetaPixelConnectionSource::Oauth,
    ]);

    Http::fake([
        'graph.facebook.com/*' => Http::response([
            'data' => [
                ['value' => 'PageView', 'count' => 42],
                ['value' => 'Lead', 'count' => 5],
            ],
        ]),
    ]);

    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/analytics/meta",
    );

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/analytics/meta/index')
            ->where('metaPixel.pixel_id', '123456789012345')
            ->where('metaAccount.email', 'owner@example.com'));
});

test('reconnecting a different facebook account clears the meta pixel link', function () {
    MetaPixelConnection::create([
        'company_id' => $this->company->id,
        'company_facebook_account_id' => $this->facebookAccount->id,
        'pixel_id' => '123456789012345',
        'connection_source' => MetaPixelConnectionSource::Oauth,
    ]);

    app(MetaAnalyticsService::class)->upsertFacebookAccount(
        $this->company,
        (object) [
            'id' => 'different-facebook-user',
            'email' => 'other@example.com',
            'name' => 'Other User',
            'token' => 'new-token',
            'refreshToken' => null,
            'approvedScopes' => ['ads_read'],
            'expiresIn' => 3600,
        ]
    );

    expect(MetaPixelConnection::query()->count())->toBe(0)
        ->and(CompanyFacebookAccount::query()->value('facebook_id'))->toBe('different-facebook-user');
});
