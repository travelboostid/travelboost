<?php

use App\Models\Company;
use App\Models\Domain;
use App\Models\Tour;
use App\Models\User;

test('tenant subdomain booking create route is accessible for authenticated users', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'testcompany',
    ]);

    Domain::create([
        'subdomain' => 'testcompany',
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
