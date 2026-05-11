<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Models\Booking;
use App\Models\BookingAddon;
use App\Models\BookingPassenger;
use App\Models\BookingRoom;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Payment;
use App\Models\PriceCategory;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Booking::unsetEventDispatcher();
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
    $this->user = User::factory()->create();
});

test('vendor can see their own bookings', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->count(3)->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    // Create a booking for another vendor — should NOT appear
    $otherVendor = Company::factory()->create(['type' => 'vendor']);
    $otherTour = Tour::factory()->create(['company_id' => $otherVendor->id]);
    Booking::factory()->create([
        'vendor_id' => $otherVendor->id,
        'tour_id' => $otherTour->id,
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

    CompanyTeam::create([
        'company_id' => $agent->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
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

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
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

test('booking index includes paid amount and remaining balance', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'grand_total' => 1_000_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 400_000,
        'status' => 'paid',
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 100_000,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.paid_amount', 400_000)
        ->where('data.data.0.remaining_balance', 600_000));
});

test('booking index derives commission amount and includes payment mode', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = now()->addMonth()->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $priceCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Twin',
        'room_type' => 'Twin',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 1_000_000,
        'commission_rate' => 10,
        'commission' => 0,
    ]);

    Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'pax_adult' => 2,
        'pax_child' => 1,
        'commission_amount' => 0,
        'payment_mode' => 'manual',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.commission_amount', '300000.00')
        ->where('data.data.0.payment_mode', 'manual'));
});

test('booking index filters waiting payment approval and exposes manual payment proof details', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'waiting payment approval',
        'payment_mode' => 'manual',
    ]);

    $payment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => 'pending',
        'payload' => [
            'payment_type' => 'down_payment',
            'sender_bank' => 'BCA',
            'sender_account' => '1234567890',
            'proof_path' => 'payment-proofs/proof.jpg',
        ],
    ]);

    Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'booking reserved',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?status=waiting%20payment%20approval");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('data.data', 1)
        ->where('data.data.0.status', 'waiting payment approval')
        ->where('data.data.0.manual_payment.id', $payment->id)
        ->where('data.data.0.manual_payment.sender_bank_name', 'BCA')
        ->where('data.data.0.manual_payment.sender_account_number', '1234567890')
        ->where('data.data.0.manual_payment.transfer_amount', 500_000)
        ->where('data.data.0.manual_payment.proof_path', 'payment-proofs/proof.jpg'));
});

test('availability save preserves manual reserved and recomputes booking reserved from bookings', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = now()->addMonth()->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $availability = TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'RS' => 1,
        'available' => 9,
    ]);

    Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(10),
        'pax_adult' => 2,
        'pax_child' => 1,
    ]);

    $response = $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/tour-availabilities", [
            'availabilities' => [
                [
                    'tour_id' => $tour->id,
                    'schedule_id' => $schedule->id,
                    'max_pax' => 10,
                    'RS' => 2,
                    'BRS' => 99,
                    'DP' => 99,
                    'available' => 99,
                ],
            ],
        ]);

    $response->assertRedirect();

    $availability->refresh();

    expect((int) $availability->RS)->toBe(2)
        ->and((int) $availability->BRS)->toBe(3)
        ->and((int) $availability->DP)->toBe(0)
        ->and((float) $availability->available)->toBe(5.0);
});

test('booking show includes room bed layout data', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->create(['minimum_down_payment' => 20]);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    BookingRoom::create([
        'booking_id' => $booking->id,
        'room_type' => 'twin',
        'room_label' => 'Twin Room 1',
        'bed_layout' => [
            ['bedType' => 'twin', 'guestId' => 'adult-0'],
            ['bedType' => 'twin', 'guestId' => 'adult-1'],
        ],
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('minimumDownPaymentPct', 20)
        ->where('booking.rooms.0.room_type', 'twin')
        ->where('booking.rooms.0.room_label', 'Twin Room 1')
        ->where('booking.rooms.0.bed_layout.0.guestId', 'adult-0')
        ->where('booking.rooms.0.bed_layout.1.guestId', 'adult-1'));
});

test('vendor can update booking wizard data dynamically', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::RESERVED,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => 1_000_000,
        'tax_amount' => 110_000,
        'platform_fee' => 25_000,
        'commission_amount' => 0,
        'grand_total' => 1_135_000,
    ]);
    $passenger = BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'first_name' => 'Old',
        'last_name' => 'Guest',
        'price_category' => 'Adult Single',
        'price_amount' => 1_000_000,
        'room_type' => 'Single',
    ]);
    BookingRoom::create([
        'booking_id' => $booking->id,
        'room_type' => 'single',
        'room_label' => 'Single Room 1',
        'bed_layout' => [['bedType' => 'single', 'guestId' => 'adult-0']],
    ]);
    BookingAddon::factory()->create([
        'booking_id' => $booking->id,
        'name' => 'Old Addon',
        'price' => 100_000,
    ]);

    $response = $this->actingAs($this->user)
        ->put("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}", [
            'contact_name' => 'Updated Customer',
            'contact_email' => 'updated@example.test',
            'contact_phone' => '08123456789',
            'contact_notes' => 'Updated from dashboard',
            'pax_adult' => 2,
            'pax_child' => 0,
            'pax_infant' => 0,
            'total_price' => 2_000_000,
            'tax_amount' => 220_000,
            'platform_fee' => 50_000,
            'commission_amount' => 100_000,
            'grand_total' => 2_370_000,
            'passengers' => [
                [
                    'id' => $passenger->id,
                    'title' => 'Mr',
                    'first_name' => 'Updated',
                    'last_name' => 'Guest',
                    'gender' => 'male',
                    'dob' => '1990-01-01',
                    'pob' => 'Jakarta',
                    'nationality' => 'Indonesia',
                    'passport_number' => 'A1234567',
                    'passport_issue_date' => '2024-01-01',
                    'passport_expiry_date' => '2030-01-01',
                    'visa_number' => 'VISA-1',
                    'price_category' => 'Adult Twin',
                    'price_amount' => 1_000_000,
                    'room_type' => 'Twin',
                    'note' => 'Window side',
                ],
                [
                    'title' => 'Ms',
                    'first_name' => 'New',
                    'last_name' => 'Guest',
                    'gender' => 'female',
                    'dob' => '1992-02-02',
                    'pob' => 'Bandung',
                    'price_category' => 'Adult Twin',
                    'price_amount' => 1_000_000,
                    'room_type' => 'Twin',
                ],
            ],
            'rooms' => [
                [
                    'room_type' => 'twin',
                    'room_label' => 'Twin Room 1',
                    'bed_layout' => [
                        ['bedType' => 'twin', 'guestId' => 'adult-0'],
                        ['bedType' => 'twin', 'guestId' => 'adult-1'],
                    ],
                ],
            ],
            'addons' => [
                ['name' => 'VISA', 'price' => 500_000],
            ],
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $booking->refresh();

    expect($booking->contact_name)->toBe('Updated Customer')
        ->and($booking->pax_adult)->toBe(2)
        ->and((float) $booking->grand_total)->toBe(2_370_000.0)
        ->and($booking->passengers)->toHaveCount(2)
        ->and($booking->rooms)->toHaveCount(1)
        ->and($booking->addons)->toHaveCount(1)
        ->and($booking->rooms()->first()->bed_layout)->toBe([
            ['bedType' => 'twin', 'guestId' => 'adult-0'],
            ['bedType' => 'twin', 'guestId' => 'adult-1'],
        ])
        ->and($booking->addons()->first()->name)->toBe('VISA')
        ->and((float) $booking->addons()->first()->price)->toBe(500_000.0);
});
