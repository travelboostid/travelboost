<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\BookingPassenger;
use App\Models\BookingRoom;
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
        ->has('agentGroups', 1)
        ->where('agentGroups.0.agent_name', 'Direct')
        ->where('agentGroups.0.bookings.0.total_pax', 1)
        ->where('roomData.0.agent_name', 'Direct')
        ->where('roomData.0.title', 'Mr')
        ->where('roomData.0.first_name', 'John')
        ->where('roomData.0.room_type', 'Twin Room')
        ->where('roomData.0.note', 'Near elevator'));
});

test('room listing includes down payment and full payment bookings with their payment status', function () {
    $downPaymentBooking = Booking::factory()->create([
        'vendor_id' => $this->vendor->id,
        'tour_id' => $this->tour->id,
        'departure_date' => '2026-08-15',
        'status' => BookingStatus::DOWN_PAYMENT,
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $downPaymentBooking->id,
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'room_type' => 'Single',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$this->vendor->username}/dashboard/reports/room-listings?tour_id={$this->tour->id}&departure_date=2026-08-15");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->has('roomData', 2)
        ->has('agentGroups.0.bookings', 2)
        ->where('agentGroups.0.bookings.0.payment_status', BookingStatus::FULL_PAYMENT->value)
        ->where('agentGroups.0.bookings.1.payment_status', BookingStatus::DOWN_PAYMENT->value));
});

test('room listing follows saved room arrangement order and keeps no bed passengers in the assigned shared room', function () {
    $this->booking->passengers()->delete();

    $singlePassenger = BookingPassenger::factory()->create([
        'booking_id' => $this->booking->id,
        'title' => 'Mrs',
        'first_name' => 'Lina',
        'last_name' => 'Jo',
        'room_type' => 'Single',
        'room_number' => '1',
        'price_category' => 'Adult Single',
    ]);

    $sharedNoBedPassenger = BookingPassenger::factory()->create([
        'booking_id' => $this->booking->id,
        'title' => 'Miss',
        'first_name' => 'Dhea',
        'last_name' => 'Jo',
        'room_type' => 'Child No Bed',
        'room_number' => '1',
        'price_category' => 'Child No Bed',
    ]);

    $doublePassengerOne = BookingPassenger::factory()->create([
        'booking_id' => $this->booking->id,
        'title' => 'Mrs',
        'first_name' => 'Lilie',
        'last_name' => 'Jo',
        'room_type' => 'Double',
        'room_number' => '2',
        'price_category' => 'Adult Double',
    ]);

    $doublePassengerTwo = BookingPassenger::factory()->create([
        'booking_id' => $this->booking->id,
        'title' => 'Mr',
        'first_name' => 'Johan',
        'last_name' => 'Jo',
        'room_type' => 'Double',
        'room_number' => '2',
        'price_category' => 'Adult Double',
    ]);

    $extraBedPassenger = BookingPassenger::factory()->create([
        'booking_id' => $this->booking->id,
        'title' => 'Miss',
        'first_name' => 'Bibi',
        'last_name' => 'Jo',
        'room_type' => 'Extra Bed',
        'room_number' => '2',
        'price_category' => 'Adult Extra Bed',
    ]);

    BookingRoom::create([
        'booking_id' => $this->booking->id,
        'room_type' => 'single',
        'room_label' => 'Room 1',
        'bed_layout' => [
            ['guestId' => (string) $singlePassenger->id, 'position' => ['x' => 0, 'y' => 0]],
        ],
    ]);

    BookingRoom::create([
        'booking_id' => $this->booking->id,
        'room_type' => 'double',
        'room_label' => 'Room 2',
        'bed_layout' => [
            ['guestId' => (string) $doublePassengerOne->id, 'position' => ['x' => 0, 'y' => 0]],
            ['guestId' => (string) $doublePassengerTwo->id, 'position' => ['x' => 1, 'y' => 0]],
            ['guestId' => (string) $extraBedPassenger->id, 'position' => ['x' => 2, 'y' => 0]],
        ],
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$this->vendor->username}/dashboard/reports/room-listings?tour_id={$this->tour->id}&departure_date=2026-08-15");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->has('roomData', 5)
        ->where('roomData.0.first_name', 'Lina')
        ->where('roomData.0.room_type', 'Single Room')
        ->where('roomData.0.room_type_note', '+ Child No Bed')
        ->where('roomData.0.room_number', '1')
        ->where('roomData.1.first_name', 'Dhea')
        ->where('roomData.1.room_type', 'Single Room')
        ->where('roomData.1.room_type_note', '+ Child No Bed')
        ->where('roomData.1.room_number', '1')
        ->where('roomData.2.first_name', 'Lilie')
        ->where('roomData.2.room_type', 'Double Room')
        ->where('roomData.2.room_type_note', '+ Adult Extra Bed')
        ->where('roomData.2.room_number', '2')
        ->where('roomData.3.first_name', 'Johan')
        ->where('roomData.3.room_type', 'Double Room')
        ->where('roomData.3.room_type_note', '+ Adult Extra Bed')
        ->where('roomData.3.room_number', '2')
        ->where('roomData.4.first_name', 'Bibi')
        ->where('roomData.4.room_type', 'Double Room')
        ->where('roomData.4.room_type_note', '+ Adult Extra Bed')
        ->where('roomData.4.room_number', '2')
        ->where('agentGroups.0.bookings.0.rooms.0.room_capacity', 1)
        ->where('agentGroups.0.bookings.0.rooms.0.room_type_note', '+ Child No Bed')
        ->where('agentGroups.0.bookings.0.rooms.0.passengers.0.first_name', 'Lina')
        ->where('agentGroups.0.bookings.0.rooms.0.passengers.1.first_name', 'Dhea')
        ->where('agentGroups.0.bookings.0.rooms.1.room_type_note', '+ Adult Extra Bed')
        ->where('agentGroups.0.bookings.0.rooms.1.passengers.0.first_name', 'Lilie')
        ->where('agentGroups.0.bookings.0.rooms.1.passengers.1.first_name', 'Johan')
        ->where('agentGroups.0.bookings.0.rooms.1.passengers.2.first_name', 'Bibi')
        ->where('roomRecap.0.roomType', 'Double Room')
        ->where('roomRecap.0.count', 1)
        ->where('roomRecap.0.unit', 'room')
        ->where('roomRecap.1.roomType', 'Single Room')
        ->where('roomRecap.1.count', 1)
        ->where('roomRecap.1.unit', 'room')
        ->where('roomRecap.2.roomType', 'Adult Extra Bed')
        ->where('roomRecap.2.count', 1)
        ->where('roomRecap.2.unit', 'pax')
        ->where('roomRecap.3.roomType', 'Child No Bed')
        ->where('roomRecap.3.count', 1)
        ->where('roomRecap.3.unit', 'pax')
    );
});

test('booking report includes down payment and full payment bookings with their payment status', function () {
    $this->booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 1_000_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now(),
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $downPaymentBooking = Booking::factory()->create([
        'vendor_id' => $this->vendor->id,
        'tour_id' => $this->tour->id,
        'departure_date' => '2026-08-15',
        'status' => BookingStatus::DOWN_PAYMENT,
        'created_at' => now()->addSecond(),
    ]);

    $downPaymentBooking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now(),
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$this->vendor->username}/dashboard/reports/bookings");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->has('rows', 2)
        ->where('rows.0.booking_status', BookingStatus::DOWN_PAYMENT->value)
        ->where('rows.1.booking_status', BookingStatus::FULL_PAYMENT->value));
});
