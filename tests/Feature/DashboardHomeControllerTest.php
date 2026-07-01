<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Models\Booking;
use App\Models\BookingPassenger;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Tour;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->user = User::factory()->create();
});

function attachOwnerToCompany(User $user, Company $company): void
{
    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
}

test('vendor dashboard exposes pax based sales stats and customer count', function () {
    $vendor = Company::factory()->create([
        'type' => 'vendor',
        'username' => 'vendor-dashboard-home',
    ]);

    attachOwnerToCompany($this->user, $vendor);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
    ]);

    $customer = User::factory()->create();
    $agent = Company::factory()->create([
        'type' => 'agent',
    ]);

    $monthlyBooking = Booking::factory()->create([
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'pax_adult' => 2,
        'pax_child' => 1,
        'pax_infant' => 1,
        'created_at' => now()->startOfMonth()->addDay(),
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $monthlyBooking->id,
        'price_amount' => 12_500_000,
    ]);

    $yearlyBooking = Booking::factory()->create([
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'pax_adult' => 1,
        'pax_child' => 1,
        'pax_infant' => 0,
        'created_at' => now()->subMonths(2),
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $yearlyBooking->id,
        'price_amount' => 8_000_000,
    ]);

    Booking::factory()->create([
        'user_id' => User::factory()->create()->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'pax_adult' => 9,
        'pax_child' => 9,
        'pax_infant' => 9,
        'created_at' => now()->subDay(),
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('companies/dashboard/home/index')
        ->where('stats.sales.monthly.idr', 12_500_000)
        ->where('stats.sales.monthly.pax', 4)
        ->where('stats.sales.yearly.idr', 20_500_000)
        ->where('stats.sales.yearly.pax', 6)
        ->where('stats.sales.total.pax', 6)
        ->where('stats.counters.customers', 1));
});

test('agent dashboard exposes pax based sales stats and customer count', function () {
    $agent = Company::factory()->create([
        'type' => 'agent',
        'username' => 'agent-dashboard-home',
    ]);

    attachOwnerToCompany($this->user, $agent);

    $vendor = Company::factory()->create([
        'type' => 'vendor',
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
    ]);

    $customer = User::factory()->create();

    $booking = Booking::factory()->create([
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'pax_adult' => 3,
        'pax_child' => 0,
        'pax_infant' => 1,
        'created_at' => now()->startOfMonth()->addDay(),
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'price_amount' => 9_500_000,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$agent->username}/dashboard");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('companies/dashboard/home/index')
        ->where('stats.sales.monthly.idr', 9_500_000)
        ->where('stats.sales.monthly.pax', 4)
        ->where('stats.sales.yearly.idr', 9_500_000)
        ->where('stats.sales.yearly.pax', 4)
        ->where('stats.counters.customers', 1));
});
