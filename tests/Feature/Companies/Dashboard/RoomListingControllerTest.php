<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Models\Booking;
use App\Models\BookingPassenger;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Tour;
use App\Models\TourSchedule;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Booking::unsetEventDispatcher();
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore([
        'id' => 1,
        'name' => 'Southeast Asia',
        'continent_id' => 1,
    ]);
    DB::table('countries')->insertOrIgnore([
        'id' => 1,
        'name' => 'Indonesia',
        'continent_id' => 1,
        'region_id' => 1,
    ]);
    $this->user = User::factory()->create();
    $this->vendor = Company::factory()->create([
        'type' => 'vendor',
        'username' => 'vendor-room-listing',
    ]);

    CompanyTeam::create([
        'company_id' => $this->vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $this->tour = Tour::factory()->create([
        'company_id' => $this->vendor->id,
        'code' => 'ROOM-1001',
        'name' => 'Japan Spring Tour',
    ]);

    TourSchedule::create([
        'tour_id' => $this->tour->id,
        'tour_code' => $this->tour->code,
        'company_id' => $this->vendor->id,
        'departure_date' => '2026-08-15',
        'return_date' => '2026-08-22',
        'is_active' => true,
    ]);

    $this->booking = Booking::factory()->create([
        'vendor_id' => $this->vendor->id,
        'tour_id' => $this->tour->id,
        'departure_date' => '2026-08-15',
        'status' => BookingStatus::FULL_PAYMENT,
        'contact_phone' => '08123456789',
        'contact_notes' => 'Vegetarian meal',
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $this->booking->id,
        'title' => 'Mr',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'room_type' => 'Twin',
        'room_number' => '201',
        'passport_number' => 'A1234567',
        'passport_issue_date' => '2020-01-01',
        'passport_expiry_date' => '2030-01-01',
        'visa_number' => 'VISA-001',
        'pob' => 'Jakarta',
        'dob' => '1990-05-20',
        'note' => 'Near elevator',
    ]);
});

test('room listing does not load dates or rows before a tour is selected', function () {
    $response = $this->actingAs($this->user)
        ->get("/companies/{$this->vendor->username}/dashboard/reports/room-listings");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('companies/dashboard/reports/room-listings/index')
        ->has('tours', 1)
        ->where('availableDates', [])
        ->where('roomData', []));
});

test('room listing loads departure dates after tour selection but keeps rows hidden until departure date is selected', function () {
    $response = $this->actingAs($this->user)
        ->get("/companies/{$this->vendor->username}/dashboard/reports/room-listings?tour_id={$this->tour->id}");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('companies/dashboard/reports/room-listings/index')
        ->has('availableDates', 1)
        ->where('availableDates.0', '2026-08-15')
        ->where('roomData', []));
});

test('room listing loads rows after both tour and departure date are selected', function () {
    $response = $this->actingAs($this->user)
        ->get("/companies/{$this->vendor->username}/dashboard/reports/room-listings?tour_id={$this->tour->id}&departure_date=2026-08-15");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('companies/dashboard/reports/room-listings/index')
        ->has('roomData', 1)
        ->where('roomData.0.first_name', 'John')
        ->where('roomData.0.room_type', 'Twin Room')
        ->where('roomData.0.note', 'Near elevator'));
});
