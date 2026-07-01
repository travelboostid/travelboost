<?php

use App\Enums\MediaType;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use App\Models\Domain;
use App\Models\Media;
use App\Models\User;
use Illuminate\Contracts\Notifications\Dispatcher as NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery\MockInterface;

uses(RefreshDatabase::class);

beforeEach(function () {
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);

    // Seed Laravolt geographical tables using correct table prefix and codes
    DB::table('indonesia_provinces')->insertOrIgnore(['id' => 1, 'code' => '1', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insertOrIgnore(['id' => 1, 'code' => '1', 'province_code' => '1', 'name' => 'Badung']);
    DB::table('indonesia_districts')->insertOrIgnore(['id' => 1, 'code' => '1', 'city_code' => '1', 'name' => 'Kuta']);
    DB::table('indonesia_villages')->insertOrIgnore(['id' => 1, 'code' => '1', 'district_code' => '1', 'name' => 'Seminyak']);

    // Seed AppConfig for free credit
    DB::table('app_configs')->insertOrIgnore([
        'key' => 'admin',
        'value' => json_encode(['free_ai_credit' => 10]),
    ]);
});

test('onboarding completes and creates domain with subdomain_enabled as false', function () {
    // Create the free trial subscription package
    AgentSubscriptionPackage::factory()->create(['id' => 1, 'price' => 0]);

    $user = User::factory()->create([
        'status' => 'inactive',
    ]);

    // Create a mock media for identity card
    $media = Media::create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'name' => 'ktp.jpg',
        'type' => MediaType::IMAGE,
        'subtype' => 'photo',
        'data' => ['path' => 'ktp.jpg'],
    ]);

    $response = $this->actingAs($user)
        ->post('/me/onboarding/create-company', [
            'name' => 'My Travel Agency',
            'username' => 'mytravelagency',
            'email' => 'agency@test.com',
            'subdomain' => 'mytravel',
            'phone' => '08123456789',
            'customer_service_phone' => '08123456789',
            'address' => 'Test Address',
            'province_id' => 1,
            'city_id' => 1,
            'district_id' => 1,
            'village_id' => 1,
            'postal_code' => '80361',
            'identity_number' => '1234567890123456',
            'identity_card_id' => $media->id,
        ]);

    $response->assertRedirect();

    $company = Company::where('username', 'mytravelagency')->first();
    expect($company)->not->toBeNull();

    $domain = $company->domain;
    expect($domain)->not->toBeNull();
    expect($domain->subdomain)->toBe('mytravel');
    expect($domain->subdomain_enabled)->toBeFalse(); // Must be false for free trial
});

test('main host onboarding applies the default affiliate referral without showing invited by data', function () {
    AgentSubscriptionPackage::factory()->create(['id' => 1, 'price' => 0]);

    $defaultAffiliateOwner = User::factory()->create([
        'name' => 'tb-affiliate',
        'status' => 'active',
    ]);

    $defaultAffiliateOwner->affiliateProfile()->create([
        'referral_code' => 'tb-affiliate',
        'status' => 'approved',
        'tier' => 'affiliate',
        'approved_at' => now(),
    ]);

    $user = User::factory()->create([
        'status' => 'inactive',
    ]);

    $this->actingAs($user)
        ->get('/me/onboarding')
        ->assertInertia(fn (Assert $page) => $page
            ->component('me/onboarding/index')
            ->where('affiliate', null));

    $media = Media::create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'name' => 'ktp.jpg',
        'type' => MediaType::IMAGE,
        'subtype' => 'photo',
        'data' => ['path' => 'ktp.jpg'],
    ]);

    $this->actingAs($user)
        ->post('/me/onboarding/create-company', [
            'name' => 'Main Host Travel Agency',
            'username' => 'mainhostagency',
            'email' => 'mainhost@test.com',
            'subdomain' => 'mainhostagency',
            'phone' => '08123456789',
            'customer_service_phone' => '08123456789',
            'address' => 'Test Address',
            'province_id' => 1,
            'city_id' => 1,
            'district_id' => 1,
            'village_id' => 1,
            'postal_code' => '80361',
            'identity_number' => '1234567890123456',
            'identity_card_id' => $media->id,
        ])
        ->assertRedirect();

    $company = Company::where('username', 'mainhostagency')->first();
    expect($company)->not->toBeNull()
        ->and($company->referred_by)->toBe($defaultAffiliateOwner->id);
});

test('onboarding from affiliate subdomain redirects to the same affiliate company dashboard host', function () {
    AgentSubscriptionPackage::factory()->create(['id' => 1, 'price' => 0]);

    $user = User::factory()->create([
        'status' => 'inactive',
    ]);

    $affiliateOwner = User::factory()->create();
    $affiliateProfile = $affiliateOwner->affiliateProfile()->create([
        'referral_code' => 'affiliate-satu',
        'status' => 'approved',
        'tier' => 'affiliate',
    ]);

    Domain::create([
        'owner_type' => $affiliateProfile::class,
        'owner_id' => $affiliateProfile->id,
        'subdomain' => 'affiliate-satu',
        'subdomain_enabled' => true,
    ]);

    $media = Media::create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'name' => 'ktp.jpg',
        'type' => MediaType::IMAGE,
        'subtype' => 'photo',
        'data' => ['path' => 'ktp.jpg'],
    ]);

    $appHost = env('APP_HOST', 'localhost');

    $response = $this->actingAs($user)
        ->post("http://affiliate-satu.{$appHost}/me/onboarding/create-company", [
            'name' => 'My Travel Agency',
            'username' => 'mytravelagency',
            'email' => 'agency@test.com',
            'subdomain' => 'mytravel',
            'phone' => '08123456789',
            'customer_service_phone' => '08123456789',
            'address' => 'Test Address',
            'province_id' => 1,
            'city_id' => 1,
            'district_id' => 1,
            'village_id' => 1,
            'postal_code' => '80361',
            'identity_number' => '1234567890123456',
            'identity_card_id' => $media->id,
        ]);

    $response->assertRedirect("http://affiliate-satu.{$appHost}/companies/mytravelagency/dashboard");

    $company = Company::where('username', 'mytravelagency')->first();
    expect($company)->not->toBeNull()
        ->and($company->referred_by)->toBe($affiliateOwner->id);
});

test('inertia onboarding request from affiliate subdomain returns an inertia location to the same affiliate company dashboard host', function () {
    AgentSubscriptionPackage::factory()->create(['id' => 1, 'price' => 0]);

    $user = User::factory()->create([
        'status' => 'inactive',
    ]);

    $affiliateOwner = User::factory()->create();
    $affiliateProfile = $affiliateOwner->affiliateProfile()->create([
        'referral_code' => 'affiliate-satu',
        'status' => 'approved',
        'tier' => 'affiliate',
    ]);

    Domain::create([
        'owner_type' => $affiliateProfile::class,
        'owner_id' => $affiliateProfile->id,
        'subdomain' => 'affiliate-satu',
        'subdomain_enabled' => true,
    ]);

    $media = Media::create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'name' => 'ktp.jpg',
        'type' => MediaType::IMAGE,
        'subtype' => 'photo',
        'data' => ['path' => 'ktp.jpg'],
    ]);

    $appHost = env('APP_HOST', 'localhost');

    $response = $this->actingAs($user)
        ->withHeaders([
            'X-Inertia' => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
        ])
        ->post("http://affiliate-satu.{$appHost}/me/onboarding/create-company", [
            'name' => 'My Travel Agency',
            'username' => '',
            'email' => 'agency@test.com',
            'subdomain' => 'mytravel',
            'phone' => '08123456789',
            'customer_service_phone' => '08123456789',
            'address' => 'Test Address',
            'province_id' => 1,
            'city_id' => 1,
            'district_id' => 1,
            'village_id' => 1,
            'postal_code' => '80361',
            'identity_number' => '1234567890123456',
            'identity_card_id' => $media->id,
        ]);

    $response->assertStatus(409);
    $response->assertHeader('X-Inertia-Location', "http://affiliate-satu.{$appHost}/companies/mytravel/dashboard");
});

test('onboarding still redirects when notification dispatch fails', function () {
    AgentSubscriptionPackage::factory()->create(['id' => 1, 'price' => 0]);

    $user = User::factory()->create([
        'status' => 'inactive',
    ]);

    $media = Media::create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'name' => 'ktp.jpg',
        'type' => MediaType::IMAGE,
        'subtype' => 'photo',
        'data' => ['path' => 'ktp.jpg'],
    ]);

    $this->mock(NotificationDispatcher::class, function (MockInterface $mock): void {
        $mock->shouldReceive('send')->andThrow(new RuntimeException('SMTP down'));
        $mock->shouldReceive('sendNow')->andThrow(new RuntimeException('SMTP down'));
    });

    $appHost = env('APP_HOST', 'localhost');
    $appPort = env('APP_PORT');
    $portSuffix = $appPort ? ':'.$appPort : '';

    $response = $this->actingAs($user)
        ->withHeaders([
            'X-Inertia' => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
        ])
        ->post('/me/onboarding/create-company', [
            'name' => 'My Travel Agency',
            'username' => 'mytravelagency',
            'email' => 'agency@test.com',
            'subdomain' => 'mytravel',
            'phone' => '08123456789',
            'customer_service_phone' => '08123456789',
            'address' => 'Test Address',
            'province_id' => 1,
            'city_id' => 1,
            'district_id' => 1,
            'village_id' => 1,
            'postal_code' => '80361',
            'identity_number' => '1234567890123456',
            'identity_card_id' => $media->id,
        ]);

    $response->assertStatus(409);
    $response->assertHeader('X-Inertia-Location', "http://{$appHost}{$portSuffix}/companies/mytravelagency/dashboard");
});

test('company dashboard accessed on a subdomain is redirected to main domain', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'testcompany',
    ]);

    $appHost = env('APP_HOST', 'localhost');

    // Trying to access dashboard on a subdomain
    $response = $this->actingAs($user)
        ->get("http://testcompany.{$appHost}/companies/testcompany/dashboard");

    // Must be redirected to main domain
    $response->assertRedirect("http://{$appHost}/companies/testcompany/dashboard");
});
