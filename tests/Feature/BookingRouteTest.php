<?php

use App\Models\Company;
use App\Models\Domain;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
});

test('tenant subdomain booking create route is accessible for authenticated users', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'testcompany',
    ]);

    Domain::create([
        'subdomain' => 'testcompany',
        'subdomain_enabled' => true,
        'owner_type' => Company::class,
        'owner_id' => $company->id,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);

    $appHost = env('APP_HOST', 'localhost');

    $response = $this->actingAs($user)
        ->get("http://testcompany.{$appHost}/bookings/{$tour->id}/create");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('tours/bookings/create'));
});

test('tenant subdomain booking create route redirects unauthenticated users', function () {
    $company = Company::factory()->create([
        'username' => 'testcompany2',
    ]);

    Domain::create([
        'subdomain' => 'testcompany2',
        'subdomain_enabled' => true,
        'owner_type' => Company::class,
        'owner_id' => $company->id,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);

    $appHost = env('APP_HOST', 'localhost');

    $response = $this->get("http://testcompany2.{$appHost}/bookings/{$tour->id}/create");

    $response->assertRedirect();
});
