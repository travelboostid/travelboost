<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\CompanyGoogleAccount;
use App\Models\CompanyTeam;
use App\Models\GoogleAnalyticsConnection;
use App\Models\User;
use App\Services\GoogleAnalyticsService;
use Database\Seeders\Common\RolePermissionSeeder;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->owner = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);

    $this->company = Company::factory()->create([
        'type' => CompanyType::AGENT,
        'username' => 'analytics-connect-company',
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
        'google_id' => 'google-user-123',
        'email' => 'owner@example.com',
        'name' => 'Owner Example',
        'access_token' => 'token',
        'refresh_token' => 'refresh',
        'scopes' => ['https://www.googleapis.com/auth/analytics.readonly'],
    ]);
});

test('company can connect analytics property without website url', function () {
    $response = $this->actingAs($this->owner)->post(
        "/companies/{$this->company->username}/dashboard/analytics/select-account",
        [
            'company_google_account_id' => $this->googleAccount->id,
            'ga_account_id' => '123456',
            'property_id' => '987654',
            'data_stream_id' => '555555',
            'measurement_id' => 'G-ABCDEFGH',
            'website_url' => null,
            'timezone' => null,
            'currency' => null,
        ],
    );

    $response->assertRedirect("/companies/{$this->company->username}/dashboard/analytics");

    $connection = GoogleAnalyticsConnection::query()->first();

    expect($connection)->not->toBeNull()
        ->and($connection->measurement_id)->toBe('G-ABCDEFGH')
        ->and($connection->data_stream_id)->toBe('555555')
        ->and($connection->website_url)->toBeNull()
        ->and($connection->timezone)->toBe('Asia/Jakarta')
        ->and($connection->currency)->toBe('IDR');
});

test('select account rejects placeholder website url before validation', function () {
    $response = $this->actingAs($this->owner)->post(
        "/companies/{$this->company->username}/dashboard/analytics/select-account",
        [
            'company_google_account_id' => $this->googleAccount->id,
            'ga_account_id' => '123456',
            'property_id' => '987654',
            'data_stream_id' => '555555',
            'measurement_id' => 'G-ABCDEFGH',
            'website_url' => '-',
            'timezone' => 'Asia/Jakarta',
            'currency' => 'IDR',
        ],
    );

    $response->assertRedirect();

    expect(GoogleAnalyticsConnection::query()->count())->toBe(1)
        ->and(GoogleAnalyticsConnection::query()->value('website_url'))->toBeNull();
});

test('company can unlink analytics property and choose another', function () {
    GoogleAnalyticsConnection::create([
        'company_google_account_id' => $this->googleAccount->id,
        'ga_account_id' => '123456',
        'property_id' => '987654',
        'data_stream_id' => '555555',
        'measurement_id' => 'G-ABCDEFGH',
    ]);

    $response = $this->actingAs($this->owner)->delete(
        "/companies/{$this->company->username}/dashboard/analytics/connection",
    );

    $response->assertRedirect(
        "/companies/{$this->company->username}/dashboard/analytics/select-or-setup-account"
    );

    expect(GoogleAnalyticsConnection::query()->count())->toBe(0);
});

test('company can disconnect google account from analytics', function () {
    GoogleAnalyticsConnection::create([
        'company_google_account_id' => $this->googleAccount->id,
        'ga_account_id' => '123456',
        'property_id' => '987654',
        'data_stream_id' => '555555',
        'measurement_id' => 'G-ABCDEFGH',
    ]);

    $response = $this->actingAs($this->owner)->delete(
        "/companies/{$this->company->username}/dashboard/google/disconnect",
    );

    $response->assertRedirect(
        "/companies/{$this->company->username}/dashboard/linked-accounts"
    );

    expect(CompanyGoogleAccount::query()->count())->toBe(0)
        ->and(GoogleAnalyticsConnection::query()->count())->toBe(0);
});

test('company owner can view linked accounts settings page', function () {
    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/linked-accounts",
    );

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/linked-accounts/index')
            ->has('accountGroups', 1)
            ->where('accountGroups.0.type', 'google')
            ->where('accountGroups.0.accounts.0.email', 'owner@example.com')
            ->where('accountGroups.0.accounts.0.integrations.1.status', 'not_connected'));
});

test('linked accounts page shows google account and analytics integration', function () {
    GoogleAnalyticsConnection::create([
        'company_google_account_id' => $this->googleAccount->id,
        'ga_account_id' => '123456',
        'property_id' => '987654',
        'data_stream_id' => '555555',
        'measurement_id' => 'G-ABCDEFGH',
        'website_url' => 'https://example.com',
    ]);

    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/linked-accounts",
    );

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/linked-accounts/index')
            ->where('accountGroups.0.accounts.0.email', 'owner@example.com')
            ->where('accountGroups.0.accounts.0.integrations.1.key', 'google_analytics')
            ->where('accountGroups.0.accounts.0.integrations.1.detail', 'G-ABCDEFGH'));
});

test('reconnecting a different google account clears the analytics property link', function () {
    GoogleAnalyticsConnection::create([
        'company_google_account_id' => $this->googleAccount->id,
        'ga_account_id' => '123456',
        'property_id' => '987654',
        'data_stream_id' => '555555',
        'measurement_id' => 'G-ABCDEFGH',
    ]);

    app(GoogleAnalyticsService::class)->upsertGoogleAccount(
        $this->company,
        (object) [
            'id' => 'different-google-user',
            'email' => 'other@example.com',
            'name' => 'Other User',
            'token' => 'new-token',
            'refreshToken' => 'new-refresh',
            'approvedScopes' => ['https://www.googleapis.com/auth/analytics.readonly'],
        ]
    );

    expect(GoogleAnalyticsConnection::query()->count())->toBe(0)
        ->and(CompanyGoogleAccount::query()->value('google_id'))->toBe('different-google-user');
});
