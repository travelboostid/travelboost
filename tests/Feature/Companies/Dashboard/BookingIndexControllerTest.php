<?php

use App\Enums\CompanyTeamStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Tour;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('vendor can see their own bookings', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::factory()->create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->count(3)->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    // Create a booking for another vendor — should NOT appear
    Booking::factory()->create([
        'vendor_id' => Company::factory()->create(['type' => 'vendor'])->id,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/index')
        ->has('data.data', 3));
});

test('agent can see their own bookings', function () {
    $agent = Company::factory()->create(['type' => 'agent']);

    CompanyTeam::factory()->create([
        'company_id' => $agent->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->count(2)->create([
        'agent_id' => $agent->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    // Create a booking for another agent — should NOT appear
    Booking::factory()->create([
        'agent_id' => Company::factory()->create(['type' => 'agent'])->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$agent->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/index')
        ->has('data.data', 2));
});

test('unauthenticated users are redirected from bookings page', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    $response = $this->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertRedirect();
});

test('users without company access are redirected', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    // User is NOT a team member of this company
    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertRedirect('/');
});

test('bookings can be filtered by booking number', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::factory()->create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-MATCH-12345',
    ]);

    Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-OTHER-99999',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?booking_number=BKG-MATCH");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('data.data', 1));
});
