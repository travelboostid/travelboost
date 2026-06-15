<?php

use App\Enums\MediaType;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use App\Models\Domain;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

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
