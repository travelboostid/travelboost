<?php

use App\Enums\CompanyTeamStatus;
use App\Models\AgentTour;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\PriceCategory;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use App\Models\VendorAgentPartner;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
});

function attachDashboardUserToCompany(User $user, Company $company): void
{
    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
}

/**
 * @return array{vendor: Company, tour: Tour, schedule: TourSchedule}
 */
function createPricedDashboardTour(): array
{
    $vendor = Company::factory()->create([
        'type' => 'vendor',
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'booking_deadline' => 0,
        'booking_entry_time_limit' => 20,
        'minimum_down_payment' => 30,
        'minimum_vat' => 11,
        'manual_bank_transfer' => 'BCA',
        'manual_bank_transfer_account_name' => 'Vendor Account',
        'manual_bank_transfer_account_number' => '1234567890',
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
    ]);

    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(45)->toDateString(),
        'return_date' => now()->addDays(50)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    $adultTwin = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Twin',
        'room_type' => 'twin',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $adultTwin->id,
        'currency' => 'IDR',
        'price' => 5_000_000,
        'promotion' => 500_000,
    ]);

    $adultSingle = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $adultSingle->id,
        'currency' => 'IDR',
        'price' => 7_000_000,
    ]);

    return compact('vendor', 'tour', 'schedule');
}

function dashboardBookingPayload(Tour $tour, TourSchedule $schedule, Company $vendor, ?Company $agent = null, string $contactEmail = 'customer@example.test', ?string $bookingNumber = null): array
{
    return [
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent?->id,
        'booking_number' => $bookingNumber ?? 'DASH-'.strtoupper(fake()->bothify('????-####')),
        'contact_name' => 'Dashboard Customer',
        'contact_email' => $contactEmail,
        'contact_phone' => '08123456789',
        'contact_notes' => null,
        'payment_type' => 'full_payment',
        'payment_method' => 'manual_transfer',
        'passengers' => [[
            'title' => 'Mr',
            'first_name' => 'Dashboard',
            'last_name' => 'Customer',
            'gender' => null,
            'dob' => now()->subYears(30)->toDateString(),
            'pob' => 'Jakarta',
            'price_category' => 'Adult Twin',
            'price_amount' => 1,
            'room_type' => 'Twin',
            'room_number' => null,
            'note' => null,
        ]],
        'addons' => [],
        'rooms' => [],
        'total_price' => 1,
        'tax_amount' => 1,
        'platform_fee' => 1,
        'commission_amount' => 1,
        'grand_total' => 1,
    ];
}

test('agent my catalog exposes schedule prices from vendor tour prices', function () {
    ['vendor' => $vendor, 'tour' => $tour] = createPricedDashboardTour();
    $agent = Company::factory()->create(['type' => 'agent']);
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $agent);

    AgentTour::create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)
        ->get("/companies/{$agent->username}/dashboard/agent-tours");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/agent-tours/index')
        ->where('data.0.tour.schedules.0.price', 4_500_000));
});

test('vendor catalog exposes schedule prices from minimum vendor tour price category', function () {
    ['vendor' => $vendor] = createPricedDashboardTour();
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $vendor);

    $response = $this->actingAs($user)
        ->get("/companies/{$vendor->username}/dashboard/vendors/{$vendor->username}/tours");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/vendor-tours/index')
        ->where('data.0.schedules.0.price', 4_500_000));
});

test('agent vendor catalog exposes schedule prices from minimum vendor tour price category', function () {
    ['vendor' => $vendor, 'tour' => $tour] = createPricedDashboardTour();
    $agent = Company::factory()->create(['type' => 'agent']);
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $agent);

    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => 'active',
    ]);

    AgentTour::create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)
        ->get("/companies/{$agent->username}/dashboard/vendors/{$vendor->username}/tours");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/vendor-tours/index')
        ->where('data.0.schedules.0.price', 4_500_000));
});

test('dashboard booking create page uses customer wizard with dashboard endpoints', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $user = User::factory()->create();
    $customer = User::factory()->create([
        'company_id' => $vendor->id,
        'name' => 'Existing Customer',
        'email' => 'existing-customer@example.test',
        'phone' => '0811111111',
    ]);
    attachDashboardUserToCompany($user, $vendor);
    $bookingCountBefore = Booking::query()->count();

    $response = $this->actingAs($user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}");

    expect(Booking::query()->count())->toBe($bookingCountBefore);

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('bookingNumber', null)
        ->where('dashboardBookingContext.isDashboard', true)
        ->where('dashboardBookingContext.reserveUrl', "/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}/reserve")
        ->where('dashboardBookingContext.storeUrl', "/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}")
        ->where('vendor.id', $vendor->id)
        ->where('tenant', null)
        ->where('tourPrices.0.categoryName', 'Adult Twin')
        ->where('tourPrices.0.price', 5_000_000)
        ->where('customerOptions.0.id', $customer->id)
        ->where('customerOptions.0.email', 'existing-customer@example.test'));
});

test('dashboard booking create exposes commission values from selected schedule price category', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $firstSchedule] = createPricedDashboardTour();
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $vendor);

    $adultTwin = PriceCategory::where('company_id', $vendor->id)
        ->where('name', 'Adult Twin')
        ->firstOrFail();

    TourPrice::query()
        ->where('schedule_id', $firstSchedule->id)
        ->where('price_category_id', $adultTwin->id)
        ->update([
            'commission' => 350_000,
            'commission_rate' => 0,
        ]);

    $secondSchedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(60)->toDateString(),
        'return_date' => now()->addDays(65)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $secondSchedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $secondSchedule->id,
        'price_category_id' => $adultTwin->id,
        'currency' => 'IDR',
        'price' => 6_000_000,
        'commission' => 0,
        'commission_rate' => 12,
    ]);

    $response = $this->actingAs($user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$secondSchedule->departure_date}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('tourPrices.0.price', 6_000_000)
        ->where('tourPrices.0.commission', 0)
        ->where('tourPrices.0.commissionRate', 12));
});

test('dashboard reserve without booking number creates one booking and reuses it on later reserve', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $payload = dashboardBookingPayload($tour, $schedule, $vendor, null, 'guest-without-account@example.test');
    $payload['booking_number'] = null;

    $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}/reserve", $payload)
        ->assertRedirect();

    $booking = Booking::query()->sole();
    expect($booking->booking_number)->not->toBeNull()
        ->and($booking->booking_number)->not->toBe('')
        ->and($booking->user_id)->toBe($dashboardUser->id);

    $payload['booking_number'] = $booking->booking_number;
    $payload['contact_phone'] = '0899999999';

    $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}/reserve", $payload)
        ->assertRedirect();

    expect(Booking::query()->count())->toBe(1);
    expect($booking->fresh()->contact_phone)->toBe('0899999999');
});

test('dashboard booking store attaches existing contact customer as booking owner', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $agent = Company::factory()->create(['type' => 'agent']);
    $dashboardUser = User::factory()->create();
    $customer = User::factory()->create(['email' => 'real-customer@example.test']);
    attachDashboardUserToCompany($dashboardUser, $agent);
    AgentTour::create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($dashboardUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/create/{$tour->id}", dashboardBookingPayload(
            $tour,
            $schedule,
            $vendor,
            $agent,
            $customer->email
        ));

    $response->assertRedirect();

    $booking = Booking::query()->latest('id')->firstOrFail();
    expect($booking->user_id)->toBe($customer->id)
        ->and($booking->vendor_id)->toBe($vendor->id)
        ->and($booking->agent_id)->toBe($agent->id)
        ->and((float) $booking->grand_total)->toBe(5_020_000.0);
});

test('dashboard booking store falls back to dashboard user when contact email has no account', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);

    $response = $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}", dashboardBookingPayload(
            $tour,
            $schedule,
            $vendor,
            null,
            'guest-without-account@example.test'
        ));

    $response->assertRedirect();

    $booking = Booking::query()->latest('id')->firstOrFail();
    expect($booking->user_id)->toBe($dashboardUser->id)
        ->and($booking->vendor_id)->toBe($vendor->id)
        ->and($booking->agent_id)->toBeNull();
});

test('dashboard booking store without booking number generates one booking number', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $payload = dashboardBookingPayload(
        $tour,
        $schedule,
        $vendor,
        null,
        'store-guest-without-account@example.test',
    );
    $payload['booking_number'] = null;

    $response = $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}", $payload);

    $response->assertRedirect();

    $booking = Booking::query()->sole();
    expect($booking->booking_number)->not->toBeNull()
        ->and($booking->booking_number)->not->toBe('')
        ->and($booking->user_id)->toBe($dashboardUser->id);
});
