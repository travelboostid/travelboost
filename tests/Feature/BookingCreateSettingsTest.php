<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Domain;
use App\Models\PriceCategory;
use App\Models\SavedPassenger;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
});

/**
 * @return array{user: User, company: Company, tour: Tour, schedule: TourSchedule}
 */
function createBookingCreateScenario(string $username): array
{
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => $username,
        'type' => 'vendor',
    ]);

    Domain::create([
        'subdomain' => $username,
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    return compact('user', 'company', 'tour', 'schedule');
}

test('booking create exposes tour prices in vendor configured row order', function () {
    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('priceordervendor');

    $adultTriple = PriceCategory::create([
        'company_id' => $company->id,
        'name' => 'Adult Triple',
        'room_type' => 'triple',
    ]);
    $adultSingle = PriceCategory::create([
        'company_id' => $company->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);
    $adultDouble = PriceCategory::create([
        'company_id' => $company->id,
        'name' => 'Adult Double',
        'room_type' => 'double',
    ]);

    TourPrice::create([
        'company_id' => $company->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $adultTriple->id,
        'currency' => 'IDR',
        'price' => 2_000_000,
    ]);
    TourPrice::create([
        'company_id' => $company->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $adultSingle->id,
        'currency' => 'IDR',
        'price' => 1_000_000,
    ]);
    TourPrice::create([
        'company_id' => $company->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $adultDouble->id,
        'currency' => 'IDR',
        'price' => 3_000_000,
    ]);

    $response = $this->actingAs($user)->get(route('bookings.create', [
        'username' => $company->username,
        'tour' => $tour,
        'date' => $schedule->departure_date,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->has('tourPrices', 3)
        ->where('tourPrices.0.categoryName', 'Adult Triple')
        ->where('tourPrices.1.categoryName', 'Adult Single')
        ->where('tourPrices.2.categoryName', 'Adult Double'));
});

test('booking create passes vendor settings to the frontend and applies schedule deadline', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'deadlinevendor',
        'type' => 'vendor',
    ]);
    $company->companySetting()->updateOrCreate([], [
        'booking_deadline' => 7,
        'booking_entry_time_limit' => 25,
        'minimum_down_payment' => 30,
        'minimum_vat' => 12,
        'term_conditions' => 'Vendor specific booking terms.',
        'manual_bank_transfer' => 'BCA',
        'manual_bank_transfer_account_name' => 'Travel Boost Vendor',
        'manual_bank_transfer_account_number' => '1234567890',
    ]);

    Domain::create([
        'subdomain' => 'deadlinevendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);

    $blockedSchedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(3)->toDateString(),
        'return_date' => now()->addDays(8)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $blockedSchedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    $response = $this->actingAs($user)->get(
        route('bookings.create', [
            'username' => 'deadlinevendor',
            'tour' => $tour,
            'date' => $blockedSchedule->departure_date,
        ])
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('availability', 0)
        ->where('bookingDeadlineDays', 7)
        ->where('bookingTimeLimitMinutes', 25)
        ->where('minimumDownPaymentPct', 30)
        ->where('minimumVatPct', 12)
        ->where('termConditions', 'Vendor specific booking terms.')
        ->where('vendorBankInfo.bankName', 'BCA')
        ->where('vendorBankInfo.accountName', 'Travel Boost Vendor')
        ->where('vendorBankInfo.accountNumber', '1234567890'));
    expect(Booking::where('user_id', $user->id)->exists())->toBeFalse();
});

test('booking create exposes saved passengers for the authenticated user only', function () {
    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('savedguestvendor');
    $otherUser = User::factory()->create();

    $savedPassenger = SavedPassenger::factory()->create([
        'user_id' => $user->id,
        'title' => 'Ms',
        'first_name' => 'Saved',
        'last_name' => 'Traveler',
        'dob' => '1992-05-10',
        'pob' => 'Jakarta',
        'passport_number' => 'A12345678',
        'passport_issue_date' => '2024-01-01',
        'passport_expiry_date' => '2030-01-01',
        'visa_number' => 'VISA-123',
        'passport_file_path' => 'travel-documents/passports/saved-passport.pdf',
        'visa_file_path' => 'travel-documents/visas/saved-visa.pdf',
    ]);
    SavedPassenger::factory()->create([
        'user_id' => $otherUser->id,
        'first_name' => 'Other',
        'last_name' => 'Traveler',
    ]);

    $response = $this->actingAs($user)->get(route('bookings.create', [
        'username' => $company->username,
        'tour' => $tour,
        'date' => $schedule->departure_date,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->has('savedPassengers', 1)
        ->where('savedPassengers.0.id', $savedPassenger->id)
        ->where('savedPassengers.0.title', 'Ms')
        ->where('savedPassengers.0.firstName', 'Saved')
        ->where('savedPassengers.0.lastName', 'Traveler')
        ->where('savedPassengers.0.dateOfBirth', '1992-05-10')
        ->where('savedPassengers.0.placeOfBirth', 'Jakarta')
        ->where('savedPassengers.0.passportNumber', 'A12345678')
        ->where('savedPassengers.0.passportIssueDate', '2024-01-01')
        ->where('savedPassengers.0.passportExpiryDate', '2030-01-01')
        ->where('savedPassengers.0.visaNumber', 'VISA-123')
        ->where('savedPassengers.0.passportFilePath', 'travel-documents/passports/saved-passport.pdf')
        ->where('savedPassengers.0.passportFileName', 'saved-passport.pdf')
        ->where('savedPassengers.0.visaFilePath', 'travel-documents/visas/saved-visa.pdf')
        ->where('savedPassengers.0.visaFileName', 'saved-visa.pdf'));
});

test('booking create classifies saved passengers by traveler type for the selected departure date', function () {
    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('savedguesttypevendor');
    $departureDate = now()->parse($schedule->departure_date);

    SavedPassenger::factory()->create([
        'user_id' => $user->id,
        'first_name' => 'Adult',
        'last_name' => 'Traveler',
        'dob' => $departureDate->copy()->subYears(20)->toDateString(),
        'updated_at' => now()->subSeconds(3),
    ]);
    SavedPassenger::factory()->create([
        'user_id' => $user->id,
        'first_name' => 'Child',
        'last_name' => 'Traveler',
        'dob' => $departureDate->copy()->subYears(7)->toDateString(),
        'updated_at' => now()->subSeconds(2),
    ]);
    SavedPassenger::factory()->create([
        'user_id' => $user->id,
        'first_name' => 'Infant',
        'last_name' => 'Traveler',
        'dob' => $departureDate->copy()->subYear()->toDateString(),
        'updated_at' => now()->subSecond(),
    ]);

    $response = $this->actingAs($user)->get(route('bookings.create', [
        'username' => $company->username,
        'tour' => $tour,
        'date' => $schedule->departure_date,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->has('savedPassengers', 3)
        ->where('savedPassengers.0.firstName', 'Infant')
        ->where('savedPassengers.0.travelerType', 'infant')
        ->where('savedPassengers.1.firstName', 'Child')
        ->where('savedPassengers.1.travelerType', 'child')
        ->where('savedPassengers.2.firstName', 'Adult')
        ->where('savedPassengers.2.travelerType', 'adult'));
});

test('reserve rejects extra bed passengers without a twin or double base room', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'extrabedvendor',
        'type' => 'vendor',
    ]);
    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);
    $departureDate = now()->addDays(20)->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    Domain::create([
        'subdomain' => 'extrabedvendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $response = $this->actingAs($user)
        ->from(route('bookings.create', [
            'username' => 'extrabedvendor',
            'tour' => $tour,
        ]))
        ->post(route('bookings.reserve', [
            'username' => 'extrabedvendor',
            'tour' => $tour,
        ]), [
            'tour_id' => $tour->id,
            'departure_date' => $departureDate,
            'pax_adult' => 1,
            'pax_child' => 0,
            'pax_infant' => 0,
            'booking_number' => 'BKG-EXTRA-BED',
            'vendor_id' => $company->id,
            'passengers' => [
                [
                    'first_name' => 'Extra',
                    'last_name' => 'Bed',
                    'price_category' => 'Adult Extra Bed',
                    'room_type' => 'Extra Bed',
                    'price_amount' => 1000000,
                ],
            ],
        ]);

    $response->assertSessionHasErrors('passengers');
});

test('reserve stores server hold expiry using ten minute fallback when setting is empty', function () {
    $this->travelTo(now()->startOfSecond());

    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'timerfallbackvendor',
        'type' => 'vendor',
    ]);
    $company->companySetting()->updateOrCreate([], [
        'booking_entry_time_limit' => 0,
    ]);
    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);
    $departureDate = now()->addDays(20)->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    Domain::create([
        'subdomain' => 'timerfallbackvendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $this->actingAs($user)
        ->post(route('bookings.reserve', [
            'username' => 'timerfallbackvendor',
            'tour' => $tour,
        ]), [
            'tour_id' => $tour->id,
            'departure_date' => $departureDate,
            'pax_adult' => 1,
            'pax_child' => 0,
            'pax_infant' => 0,
            'booking_number' => 'BKG-TIMER-FALLBACK',
            'vendor_id' => $company->id,
            'passengers' => [
                [
                    'first_name' => 'Timer',
                    'last_name' => 'Fallback',
                    'price_category' => 'Adult Twin',
                    'room_type' => 'Twin',
                    'price_amount' => 1000000,
                ],
            ],
        ])
        ->assertRedirect();

    $booking = Booking::where('booking_number', 'BKG-TIMER-FALLBACK')->firstOrFail();

    expect($booking->status)->toBe(BookingStatus::BOOKING_RESERVED)
        ->and($booking->reserved_expires_at->equalTo(now()->addMinutes(10)))->toBeTrue();
});

test('reserve rejects zero passengers before starting the hold timer', function () {
    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('zeropaxreservevendor');

    $response = $this->actingAs($user)
        ->from(route('bookings.create', [
            'username' => $company->username,
            'tour' => $tour,
            'date' => $schedule->departure_date,
        ]))
        ->post(route('bookings.reserve', [
            'username' => $company->username,
            'tour' => $tour,
        ]), [
            'tour_id' => $tour->id,
            'departure_date' => $schedule->departure_date,
            'pax_adult' => 0,
            'pax_child' => 0,
            'pax_infant' => 0,
            'booking_number' => 'BKG-ZERO-PAX',
            'vendor_id' => $company->id,
            'passengers' => [],
        ]);

    $response->assertSessionHasErrors('passengers');
    $this->assertDatabaseMissing('bookings', [
        'booking_number' => 'BKG-ZERO-PAX',
        'status' => BookingStatus::BOOKING_RESERVED->value,
    ]);
});

test('reserve rejects schedules after the vendor booking deadline without starting a hold', function () {
    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('closedreservevendor');
    $company->companySetting()->updateOrCreate([], [
        'booking_deadline' => 30,
    ]);

    $response = $this->actingAs($user)
        ->from(route('bookings.create', [
            'username' => $company->username,
            'tour' => $tour,
            'date' => $schedule->departure_date,
        ]))
        ->post(route('bookings.reserve', [
            'username' => $company->username,
            'tour' => $tour,
        ]), [
            'tour_id' => $tour->id,
            'departure_date' => $schedule->departure_date,
            'pax_adult' => 1,
            'pax_child' => 0,
            'pax_infant' => 0,
            'booking_number' => 'BKG-CLOSED-RESERVE',
            'vendor_id' => $company->id,
            'passengers' => [
                [
                    'first_name' => 'Closed',
                    'last_name' => 'Window',
                    'price_category' => 'Adult Twin',
                    'room_type' => 'Twin',
                    'price_amount' => 1000000,
                ],
            ],
        ]);

    $response->assertSessionHasErrors('departure_date');
    $this->assertDatabaseMissing('bookings', [
        'booking_number' => 'BKG-CLOSED-RESERVE',
    ]);
});

test('customer can intentionally release their active booking reserved hold', function () {
    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('releaseholdvendor');

    $booking = Booking::factory()->create([
        'booking_number' => 'BKG-RELEASE-HOLD',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(8),
        'pax_adult' => 2,
        'pax_child' => 0,
    ]);

    app(\App\Actions\Booking\SyncAvailabilityAction::class)->executeForBooking($booking);
    expect((int) TourAvailability::where('schedule_id', $schedule->id)->first()->available)->toBe(8);

    $response = $this->actingAs($user)
        ->post("/bookings/{$booking->id}/release-hold");

    $response->assertRedirect();
    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => BookingStatus::EXPIRED->value,
        'reserved_expires_at' => null,
    ]);
    expect((int) TourAvailability::where('schedule_id', $schedule->id)->first()->available)->toBe(10);
});

test('customer cannot release another users booking hold', function () {
    ['company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('releaseotherholdvendor');
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $booking = Booking::factory()->create([
        'user_id' => $owner->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(8),
    ]);

    $this->actingAs($otherUser)
        ->post("/bookings/{$booking->id}/release-hold")
        ->assertForbidden();

    expect($booking->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED);
});

test('customer can release their active booking reserved hold from tenant subdomain route', function () {
    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('tenantreleaseholdvendor');

    $booking = Booking::factory()->create([
        'booking_number' => 'BKG-TENANT-RELEASE-HOLD',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(8),
        'pax_adult' => 1,
        'pax_child' => 0,
    ]);
    app(\App\Actions\Booking\SyncAvailabilityAction::class)->executeForBooking($booking);
    $appHost = env('APP_HOST', 'localhost');

    $response = $this->actingAs($user)
        ->post("http://{$company->username}.{$appHost}/bookings/{$booking->id}/release-hold");

    $response->assertRedirect();
    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => BookingStatus::EXPIRED->value,
        'reserved_expires_at' => null,
    ]);
});

test('booking create returns server remaining hold seconds when resuming reserved booking', function () {
    $this->travelTo(now()->startOfSecond());

    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'remainingholdvendor',
        'type' => 'vendor',
    ]);

    Domain::create([
        'subdomain' => 'remainingholdvendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);
    Booking::factory()->create([
        'booking_number' => 'BKG-REMAINING-HOLD',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(7),
    ]);

    $response = $this->actingAs($user)->get(
        route('bookings.create', [
            'username' => 'remainingholdvendor',
            'tour' => $tour,
            'date' => $schedule->departure_date,
        ])
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('reservedExpiresAt', now()->addMinutes(7)->toIso8601String())
        ->where('remainingHoldSeconds', 420));
});

test('store maps payment method to booking payment mode', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'paymentmodevendor',
        'type' => 'vendor',
    ]);
    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
        'promote_price' => 0,
    ]);

    Domain::create([
        'subdomain' => 'paymentmodevendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);
    $departureDate = now()->addDays(20)->toDateString();
    $this->actingAs($user)
        ->post(route('bookings.store', [
            'username' => 'paymentmodevendor',
            'tour' => $tour,
        ]), [
            'booking_number' => 'BKG-PAYMENT-MODE',
            'tour_id' => $tour->id,
            'departure_date' => $departureDate,
            'pax_adult' => 1,
            'pax_child' => 0,
            'pax_infant' => 0,
            'vendor_id' => $company->id,
            'contact_name' => 'Payment Mode',
            'contact_email' => 'payment-mode@example.com',
            'contact_phone' => '08123456789',
            'payment_type' => 'full_payment',
            'payment_method' => 'manual_transfer',
            'passengers' => [
                [
                    'first_name' => 'Payment',
                    'last_name' => 'Mode',
                    'pob' => 'Jakarta',
                    'price_category' => 'Adult Twin',
                    'price_amount' => 1_000_000,
                ],
            ],
            'total_price' => 1_000_000,
            'tax_amount' => 110_000,
            'platform_fee' => 25_000,
            'commission_amount' => 0,
            'grand_total' => 1_135_000,
        ]);

    $this->assertDatabaseHas('bookings', [
        'booking_number' => 'BKG-PAYMENT-MODE',
        'payment_mode' => 'manual',
    ]);
});

test('store persists room arrangement and travel document data', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'persistvendor',
        'type' => 'vendor',
    ]);
    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
        'promote_price' => 0,
    ]);

    Domain::create([
        'subdomain' => 'persistvendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $response = $this->actingAs($user)
        ->post(route('bookings.store', [
            'username' => 'persistvendor',
            'tour' => $tour,
        ]), [
            'booking_number' => 'BKG-DATA-PERSISTENCE',
            'tour_id' => $tour->id,
            'departure_date' => now()->addDays(20)->toDateString(),
            'pax_adult' => 2,
            'pax_child' => 0,
            'pax_infant' => 0,
            'vendor_id' => $company->id,
            'contact_name' => 'Data Persistence',
            'contact_email' => 'data-persistence@example.com',
            'contact_phone' => '08123456789',
            'payment_type' => 'full_payment',
            'payment_method' => 'manual_transfer',
            'passengers' => [
                [
                    'title' => 'Mr',
                    'first_name' => 'Primary',
                    'last_name' => 'Guest',
                    'pob' => 'Jakarta',
                    'price_category' => 'Adult Twin',
                    'price_amount' => 1_000_000,
                    'passport_number' => 'A1234567',
                    'passport_issue_date' => '2024-01-01',
                    'passport_expiry_date' => '2030-01-01',
                    'passport_file' => UploadedFile::fake()->image('passport.jpg'),
                    'visa_number' => 'VISA-1',
                    'visa_file' => UploadedFile::fake()->create('visa.pdf', 120, 'application/pdf'),
                    'room_type' => 'Twin',
                    'room_number' => '1',
                ],
                [
                    'title' => 'Ms',
                    'first_name' => 'Second',
                    'last_name' => 'Guest',
                    'pob' => 'Bandung',
                    'price_category' => 'Adult Twin',
                    'price_amount' => 1_000_000,
                    'room_type' => 'Twin',
                    'room_number' => '1',
                ],
            ],
            'rooms' => [
                [
                    'room_type' => 'twin',
                    'room_label' => 'Room 1',
                    'bed_layout' => [
                        ['bedType' => 'twin', 'guestId' => 'adult-0', 'position' => ['x' => 0, 'y' => 0]],
                        ['bedType' => 'twin', 'guestId' => 'adult-1', 'position' => ['x' => 1, 'y' => 0]],
                    ],
                ],
            ],
            'total_price' => 2_000_000,
            'tax_amount' => 220_000,
            'platform_fee' => 50_000,
            'commission_amount' => 0,
            'grand_total' => 2_270_000,
        ]);

    $response->assertSessionHasNoErrors();

    $booking = Booking::with(['passengers', 'rooms'])
        ->where('booking_number', 'BKG-DATA-PERSISTENCE')
        ->firstOrFail();
    $passenger = $booking->passengers->firstWhere('first_name', 'Primary');

    expect($booking->rooms)->toHaveCount(1)
        ->and($booking->rooms->first()->bed_layout)->toBe([
            ['bedType' => 'twin', 'guestId' => 'adult-0', 'position' => ['x' => 0, 'y' => 0]],
            ['bedType' => 'twin', 'guestId' => 'adult-1', 'position' => ['x' => 1, 'y' => 0]],
        ])
        ->and($passenger->room_number)->toBe('1')
        ->and($passenger->passport_issue_date->toDateString())->toBe('2024-01-01')
        ->and($passenger->passport_expiry_date->toDateString())->toBe('2030-01-01')
        ->and($passenger->visa_number)->toBe('VISA-1')
        ->and($passenger->passport_file_path)->toStartWith('travel-documents/passports/')
        ->and($passenger->visa_file_path)->toStartWith('travel-documents/visas/');

    Storage::disk('public')->assertExists($passenger->passport_file_path);
    Storage::disk('public')->assertExists($passenger->visa_file_path);
});

test('store auto saves submitted passengers with uploaded travel documents', function () {
    Storage::fake('public');

    ['user' => $user, 'company' => $company, 'tour' => $tour] = createBookingCreateScenario('autosaveguestvendor');
    $tour->update(['promote_price' => 0]);

    $response = $this->actingAs($user)
        ->post(route('bookings.store', [
            'username' => $company->username,
            'tour' => $tour,
        ]), [
            'booking_number' => 'BKG-SAVED-GUEST-UPLOAD',
            'tour_id' => $tour->id,
            'departure_date' => now()->addDays(20)->toDateString(),
            'pax_adult' => 1,
            'pax_child' => 0,
            'pax_infant' => 0,
            'vendor_id' => $company->id,
            'contact_name' => 'Saved Guest',
            'contact_email' => 'saved-guest@example.com',
            'contact_phone' => '08123456789',
            'payment_type' => 'full_payment',
            'payment_method' => 'manual_transfer',
            'passengers' => [
                [
                    'title' => 'Mrs',
                    'first_name' => 'Auto',
                    'last_name' => 'Saved',
                    'dob' => '1990-02-03',
                    'pob' => 'Surabaya',
                    'price_category' => 'Adult Single',
                    'price_amount' => 1_000_000,
                    'passport_number' => 'B12345678',
                    'passport_issue_date' => '2024-02-01',
                    'passport_expiry_date' => '2030-02-01',
                    'passport_file' => UploadedFile::fake()->image('auto-passport.jpg'),
                    'visa_number' => 'VISA-AUTO',
                    'visa_file' => UploadedFile::fake()->create('auto-visa.pdf', 120, 'application/pdf'),
                    'room_type' => 'Single',
                    'room_number' => '1',
                ],
            ],
            'total_price' => 1_000_000,
            'tax_amount' => 110_000,
            'platform_fee' => 25_000,
            'commission_amount' => 0,
            'grand_total' => 1_135_000,
        ]);

    $response->assertSessionHasNoErrors();

    $savedPassenger = SavedPassenger::query()
        ->where('user_id', $user->id)
        ->where('first_name', 'Auto')
        ->where('last_name', 'Saved')
        ->firstOrFail();

    expect($savedPassenger->title)->toBe('Mrs')
        ->and($savedPassenger->dob->toDateString())->toBe('1990-02-03')
        ->and($savedPassenger->pob)->toBe('Surabaya')
        ->and($savedPassenger->passport_number)->toBe('B12345678')
        ->and($savedPassenger->passport_issue_date->toDateString())->toBe('2024-02-01')
        ->and($savedPassenger->passport_expiry_date->toDateString())->toBe('2030-02-01')
        ->and($savedPassenger->visa_number)->toBe('VISA-AUTO')
        ->and($savedPassenger->passport_file_path)->toStartWith('travel-documents/passports/')
        ->and($savedPassenger->visa_file_path)->toStartWith('travel-documents/visas/');

    Storage::disk('public')->assertExists($savedPassenger->passport_file_path);
    Storage::disk('public')->assertExists($savedPassenger->visa_file_path);
});

test('store reuses saved passenger document paths without requiring new uploads', function () {
    Storage::fake('public');

    ['user' => $user, 'company' => $company, 'tour' => $tour] = createBookingCreateScenario('reuseguestvendor');
    $tour->update(['promote_price' => 0]);
    Storage::disk('public')->put('travel-documents/passports/reused-passport.pdf', 'passport');
    Storage::disk('public')->put('travel-documents/visas/reused-visa.pdf', 'visa');

    $response = $this->actingAs($user)
        ->post(route('bookings.store', [
            'username' => $company->username,
            'tour' => $tour,
        ]), [
            'booking_number' => 'BKG-SAVED-GUEST-REUSE',
            'tour_id' => $tour->id,
            'departure_date' => now()->addDays(20)->toDateString(),
            'pax_adult' => 1,
            'pax_child' => 0,
            'pax_infant' => 0,
            'vendor_id' => $company->id,
            'contact_name' => 'Reuse Guest',
            'contact_email' => 'reuse-guest@example.com',
            'contact_phone' => '08123456789',
            'payment_type' => 'full_payment',
            'payment_method' => 'manual_transfer',
            'passengers' => [
                [
                    'title' => 'Mr',
                    'first_name' => 'Reuse',
                    'last_name' => 'Saved',
                    'dob' => '1988-03-04',
                    'pob' => 'Bandung',
                    'price_category' => 'Adult Single',
                    'price_amount' => 1_000_000,
                    'passport_number' => 'C12345678',
                    'passport_issue_date' => '2024-03-01',
                    'passport_expiry_date' => '2030-03-01',
                    'passport_file_path' => 'travel-documents/passports/reused-passport.pdf',
                    'visa_number' => 'VISA-REUSE',
                    'visa_file_path' => 'travel-documents/visas/reused-visa.pdf',
                    'room_type' => 'Single',
                    'room_number' => '1',
                ],
            ],
            'total_price' => 1_000_000,
            'tax_amount' => 110_000,
            'platform_fee' => 25_000,
            'commission_amount' => 0,
            'grand_total' => 1_135_000,
        ]);

    $response->assertSessionHasNoErrors();

    $booking = Booking::with('passengers')
        ->where('booking_number', 'BKG-SAVED-GUEST-REUSE')
        ->firstOrFail();
    $passenger = $booking->passengers->first();
    $savedPassenger = SavedPassenger::query()
        ->where('user_id', $user->id)
        ->where('first_name', 'Reuse')
        ->where('last_name', 'Saved')
        ->firstOrFail();

    expect($passenger->passport_file_path)->toBe('travel-documents/passports/reused-passport.pdf')
        ->and($passenger->visa_file_path)->toBe('travel-documents/visas/reused-visa.pdf')
        ->and($savedPassenger->passport_file_path)->toBe('travel-documents/passports/reused-passport.pdf')
        ->and($savedPassenger->visa_file_path)->toBe('travel-documents/visas/reused-visa.pdf');
});

test('auto created booking for a selected schedule does not skip terms gate as a resume', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'tncvendor',
        'type' => 'vendor',
    ]);

    Domain::create([
        'subdomain' => 'tncvendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);

    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    $response = $this->actingAs($user)->get(
        route('bookings.create', [
            'username' => 'tncvendor',
            'tour' => $tour,
            'date' => $schedule->departure_date,
        ])
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->has('existingBooking')
        ->where('isResumingExistingBooking', false)
        ->where('existingBooking.pax_adult', 0)
        ->where('existingBooking.pax_child', 0)
        ->where('existingBooking.pax_infant', 0));
});

test('booking create exposes paid and remaining balances for down payment bookings', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'balancevendor',
        'type' => 'vendor',
    ]);

    Domain::create([
        'subdomain' => 'balancevendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);

    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 8,
    ]);

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::DOWN_PAYMENT,
        'grand_total' => 1_000_000,
    ]);

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 250_000,
        'status' => PaymentStatus::PAID,
    ]);

    $response = $this->actingAs($user)->get(
        route('bookings.create', [
            'username' => 'balancevendor',
            'tour' => $tour,
            'date' => $schedule->departure_date,
            'booking_number' => $booking->booking_number,
        ])
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('isResumingExistingBooking', true)
        ->where('paidAmount', 250000)
        ->where('remainingBalance', 750000));
});

test('booking create exposes paid booking room payload without hold timer', function () {
    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('paidroompayloadvendor');

    $booking = Booking::factory()->create([
        'booking_number' => 'BKG-PAID-ROOMS',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::DOWN_PAYMENT,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
        'reserved_type' => 'system',
        'reserved_expires_at' => null,
        'pax_adult' => 1,
        'pax_infant' => 1,
    ]);
    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 250_000,
        'status' => PaymentStatus::PAID,
    ]);
    $adult = $booking->passengers()->create([
        'first_name' => 'Paid',
        'last_name' => 'Adult',
        'pob' => 'Jakarta',
        'price_category' => 'Adult Single',
        'price_amount' => 1_000_000,
        'room_number' => '1',
    ]);
    $infant = $booking->passengers()->create([
        'first_name' => 'Paid',
        'last_name' => 'Infant',
        'pob' => 'Jakarta',
        'price_category' => 'Infant',
        'price_amount' => 0,
        'room_number' => '1',
    ]);
    $booking->rooms()->create([
        'room_type' => 'single',
        'room_label' => 'Room 1',
        'bed_layout' => [
            ['bedType' => 'single', 'guestId' => (string) $adult->id, 'position' => ['x' => 0, 'y' => 0]],
        ],
    ]);

    $response = $this->actingAs($user)->get(route('bookings.create', [
        'username' => $company->username,
        'tour' => $tour,
        'date' => $schedule->departure_date,
        'booking_number' => $booking->booking_number,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('isResumingExistingBooking', true)
        ->where('existingBooking.booking_number', 'BKG-PAID-ROOMS')
        ->where('existingBooking.status', BookingStatus::DOWN_PAYMENT->value)
        ->where('existingBooking.passengers.0.id', $adult->id)
        ->where('existingBooking.passengers.1.id', $infant->id)
        ->where('existingBooking.rooms.0.bed_layout.0.guestId', (string) $adult->id)
        ->where('paidAmount', 250000)
        ->where('remainingBalance', 750000)
        ->where('reservedExpiresAt', null)
        ->where('remainingHoldSeconds', null));
});

test('same schedule waiting payment approval booking blocks silent reuse', function () {
    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('wpaconflictvendor');

    Booking::factory()->create([
        'booking_number' => 'BKG-WPA-CONFLICT',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
    ]);
    $bookingCount = Booking::where('user_id', $user->id)
        ->where('tour_id', $tour->id)
        ->whereDate('departure_date', $schedule->departure_date)
        ->count();

    $response = $this->actingAs($user)->get(
        route('bookings.create', [
            'username' => 'wpaconflictvendor',
            'tour' => $tour,
            'date' => $schedule->departure_date,
        ])
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('existingBooking', null)
        ->where('isResumingExistingBooking', false)
        ->where('bookingConflict.bookingNumber', 'BKG-WPA-CONFLICT')
        ->where('bookingConflict.status', BookingStatus::WAITING_PAYMENT_APPROVAL->value)
        ->where('bookingConflict.checkPaymentStatusUrl', '/mybookings?tab=current&booking_number=BKG-WPA-CONFLICT')
        ->where('bookingConflict.newBookingUrl', "/bookings/{$tour->id}/create?date={$schedule->departure_date}&force_new=1"));
    expect(Booking::where('user_id', $user->id)
        ->where('tour_id', $tour->id)
        ->whereDate('departure_date', $schedule->departure_date)
        ->count())->toBe($bookingCount);
});

test('same schedule down payment booking blocks silent reuse and exposes balance continuation', function () {
    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('dpconflictvendor');

    Booking::factory()->create([
        'booking_number' => 'BKG-DP-CONFLICT',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::DOWN_PAYMENT,
        'grand_total' => 1_000_000,
    ]);
    $bookingCount = Booking::where('user_id', $user->id)
        ->where('tour_id', $tour->id)
        ->whereDate('departure_date', $schedule->departure_date)
        ->count();

    $response = $this->actingAs($user)->get(
        route('bookings.create', [
            'username' => 'dpconflictvendor',
            'tour' => $tour,
            'date' => $schedule->departure_date,
        ])
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('existingBooking', null)
        ->where('isResumingExistingBooking', false)
        ->where('bookingConflict.bookingNumber', 'BKG-DP-CONFLICT')
        ->where('bookingConflict.status', BookingStatus::DOWN_PAYMENT->value)
        ->where('bookingConflict.continuePaymentUrl', "/bookings/{$tour->id}/create?date={$schedule->departure_date}&booking_number=BKG-DP-CONFLICT")
        ->where('bookingConflict.newBookingUrl', "/bookings/{$tour->id}/create?date={$schedule->departure_date}&force_new=1"));
    expect(Booking::where('user_id', $user->id)
        ->where('tour_id', $tour->id)
        ->whereDate('departure_date', $schedule->departure_date)
        ->count())->toBe($bookingCount);
});

test('same schedule conflict can be bypassed only with force new booking', function () {
    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('forcenewvendor');

    Booking::factory()->create([
        'booking_number' => 'BKG-FORCE-WPA',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
    ]);

    $response = $this->actingAs($user)->get(
        route('bookings.create', [
            'username' => 'forcenewvendor',
            'tour' => $tour,
            'date' => $schedule->departure_date,
            'force_new' => 1,
        ])
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('bookingConflict', null)
        ->where('isResumingExistingBooking', false)
        ->whereNot('bookingNumber', 'BKG-FORCE-WPA'));
    expect(Booking::where('user_id', $user->id)
        ->where('tour_id', $tour->id)
        ->whereDate('departure_date', $schedule->departure_date)
        ->count())->toBe(2);
});

test('expired future booking can be reordered with the same booking number', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'reordervendor',
        'type' => 'vendor',
    ]);

    Domain::create([
        'subdomain' => 'reordervendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    Booking::factory()->create([
        'booking_number' => 'BKG-REORDER-EXPIRED',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::EXPIRED,
        'reserved_type' => 'system',
        'reserved_expires_at' => null,
    ]);

    $response = $this->actingAs($user)->get(
        route('bookings.create', [
            'username' => 'reordervendor',
            'tour' => $tour,
            'date' => $schedule->departure_date,
            'booking_number' => 'BKG-REORDER-EXPIRED',
        ])
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('bookingNumber', 'BKG-REORDER-EXPIRED')
        ->where('existingBooking.booking_number', 'BKG-REORDER-EXPIRED')
        ->where('isResumingExistingBooking', true)
        ->where('reservedExpiresAt', null)
        ->where('remainingHoldSeconds', null));
});

test('expired future booking can be reset through reorder endpoint with the same booking number', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'endpointreordervendor',
        'type' => 'vendor',
    ]);

    Domain::create([
        'subdomain' => 'endpointreordervendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    $booking = Booking::factory()->create([
        'booking_number' => 'BKG-REORDER-ENDPOINT',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::EXPIRED,
        'reserved_type' => 'system',
        'reserved_expires_at' => null,
    ]);
    $booking->passengers()->create([
        'first_name' => 'Reuse',
        'last_name' => 'Guest',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
        'room_number' => '1',
    ]);
    $booking->rooms()->create([
        'room_type' => 'twin',
        'room_label' => 'Room 1',
        'bed_layout' => [
            ['bedType' => 'twin', 'guestId' => 'adult-0', 'position' => ['x' => 0, 'y' => 0]],
        ],
    ]);
    Booking::factory()->create([
        'booking_number' => 'BKG-COMPETING-HOLD',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(10),
    ]);

    $response = $this->actingAs($user)->post("/bookings/{$booking->id}/reorder");

    $response->assertRedirect(route('bookings.create', [
        'username' => 'endpointreordervendor',
        'tour' => $tour,
        'date' => $schedule->departure_date,
        'booking_number' => 'BKG-REORDER-ENDPOINT',
    ]));
    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'booking_number' => 'BKG-REORDER-ENDPOINT',
        'status' => BookingStatus::AWAITING_PAYMENT->value,
        'reserved_expires_at' => null,
    ]);
    expect($booking->fresh()->passengers)->toHaveCount(1)
        ->and($booking->fresh()->rooms)->toHaveCount(1);

    $createResponse = $this->actingAs($user)->get(route('bookings.create', [
        'username' => 'endpointreordervendor',
        'tour' => $tour,
        'date' => $schedule->departure_date,
        'booking_number' => 'BKG-REORDER-ENDPOINT',
    ]));

    $createResponse->assertOk();
    $createResponse->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('bookingNumber', 'BKG-REORDER-ENDPOINT')
        ->where('existingBooking.booking_number', 'BKG-REORDER-ENDPOINT')
        ->where('existingBooking.rooms.0.room_type', 'twin')
        ->where('existingBooking.rooms.0.room_label', 'Room 1')
        ->where('existingBooking.rooms.0.bed_layout.0.guestId', 'adult-0'));
});

test('reorder endpoint rejects expired bookings after the vendor booking deadline', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'closedreordervendor',
        'type' => 'vendor',
    ]);
    $company->companySetting()->updateOrCreate([], [
        'booking_deadline' => 30,
    ]);

    Domain::create([
        'subdomain' => 'closedreordervendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(10)->toDateString(),
        'return_date' => now()->addDays(15)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    $booking = Booking::factory()->create([
        'booking_number' => 'BKG-CLOSED-REORDER',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::EXPIRED,
        'reserved_type' => 'system',
        'reserved_expires_at' => null,
    ]);

    $this->actingAs($user)
        ->post("/bookings/{$booking->id}/reorder")
        ->assertStatus(422);

    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'booking_number' => 'BKG-CLOSED-REORDER',
        'status' => BookingStatus::EXPIRED->value,
    ]);
});

test('selecting the same schedule reuses a future expired booking number without query parameter', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'sameexpiredvendor',
        'type' => 'vendor',
    ]);

    Domain::create([
        'subdomain' => 'sameexpiredvendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    Booking::factory()->create([
        'booking_number' => 'BKG-SAME-SCHEDULE',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::EXPIRED,
        'reserved_type' => 'system',
        'reserved_expires_at' => null,
    ]);

    $response = $this->actingAs($user)->get(
        route('bookings.create', [
            'username' => 'sameexpiredvendor',
            'tour' => $tour,
            'date' => $schedule->departure_date,
        ])
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('bookingNumber', 'BKG-SAME-SCHEDULE')
        ->where('existingBooking.booking_number', 'BKG-SAME-SCHEDULE')
        ->where('isResumingExistingBooking', true));
    expect(Booking::where('user_id', $user->id)
        ->where('tour_id', $tour->id)
        ->whereDate('departure_date', $schedule->departure_date)
        ->count())->toBe(1);
});

test('expired past booking number is not reused for reorder', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'pastreordervendor',
        'type' => 'vendor',
    ]);

    Domain::create([
        'subdomain' => 'pastreordervendor',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => 'active',
    ]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->subDay()->toDateString(),
        'return_date' => now()->addDays(4)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    Booking::factory()->create([
        'booking_number' => 'BKG-REORDER-PAST',
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::EXPIRED,
        'reserved_type' => 'system',
        'reserved_expires_at' => null,
    ]);

    $response = $this->actingAs($user)->get(
        route('bookings.create', [
            'username' => 'pastreordervendor',
            'tour' => $tour,
            'date' => $schedule->departure_date,
            'booking_number' => 'BKG-REORDER-PAST',
        ])
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->whereNot('bookingNumber', 'BKG-REORDER-PAST')
        ->where('existingBooking', null)
        ->where('isResumingExistingBooking', false));
});

test('customer can update travel documents without changing booking status or totals', function () {
    Storage::fake('public');

    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('documentupdatevendor');

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::DOWN_PAYMENT,
        'grand_total' => 1_000_000,
    ]);
    $passenger = $booking->passengers()->create([
        'first_name' => 'Document',
        'last_name' => 'Guest',
        'pob' => 'Jakarta',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
    ]);

    $response = $this->actingAs($user)
        ->post("/bookings/{$booking->id}/travel-documents", [
            'passengers' => [
                [
                    'id' => $passenger->id,
                    'passport_number' => 'P1234567',
                    'passport_issue_date' => '2024-01-01',
                    'passport_expiry_date' => '2030-01-01',
                    'passport_file' => UploadedFile::fake()->create('passport.pdf', 120, 'application/pdf'),
                    'visa_number' => 'VISA-123',
                    'visa_file' => UploadedFile::fake()->image('visa.jpg'),
                ],
            ],
        ]);

    $response->assertRedirect();

    $updatedPassenger = $passenger->fresh();
    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and((float) $booking->fresh()->grand_total)->toBe(1_000_000.0)
        ->and($updatedPassenger->passport_number)->toBe('P1234567')
        ->and($updatedPassenger->passport_issue_date->toDateString())->toBe('2024-01-01')
        ->and($updatedPassenger->passport_expiry_date->toDateString())->toBe('2030-01-01')
        ->and($updatedPassenger->visa_number)->toBe('VISA-123')
        ->and($updatedPassenger->passport_file_path)->toStartWith('travel-documents/passports/')
        ->and($updatedPassenger->visa_file_path)->toStartWith('travel-documents/visas/');

    Storage::disk('public')->assertExists($updatedPassenger->passport_file_path);
    Storage::disk('public')->assertExists($updatedPassenger->visa_file_path);

    $savedPassenger = SavedPassenger::query()
        ->where('user_id', $user->id)
        ->where('first_name', 'Document')
        ->where('last_name', 'Guest')
        ->firstOrFail();

    expect($savedPassenger->pob)->toBe('Jakarta')
        ->and($savedPassenger->passport_number)->toBe('P1234567')
        ->and($savedPassenger->passport_issue_date->toDateString())->toBe('2024-01-01')
        ->and($savedPassenger->passport_expiry_date->toDateString())->toBe('2030-01-01')
        ->and($savedPassenger->visa_number)->toBe('VISA-123')
        ->and($savedPassenger->passport_file_path)->toBe($updatedPassenger->passport_file_path)
        ->and($savedPassenger->visa_file_path)->toBe($updatedPassenger->visa_file_path);

    $this->actingAs($user)
        ->get(route('bookings.create', [
            'username' => $company->username,
            'tour' => $tour,
            'date' => $schedule->departure_date,
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('savedPassengers.0.firstName', 'Document')
            ->where('savedPassengers.0.lastName', 'Guest')
            ->where('savedPassengers.0.passportNumber', 'P1234567')
            ->where('savedPassengers.0.passportFilePath', $updatedPassenger->passport_file_path)
            ->where('savedPassengers.0.visaNumber', 'VISA-123')
            ->where('savedPassengers.0.visaFilePath', $updatedPassenger->visa_file_path));
});

test('customer can update travel documents from tenant subdomain route', function () {
    Storage::fake('public');

    ['user' => $user, 'company' => $company, 'tour' => $tour, 'schedule' => $schedule] = createBookingCreateScenario('tenantdocumentupdate');

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 1_000_000,
    ]);
    $passenger = $booking->passengers()->create([
        'first_name' => 'Tenant',
        'last_name' => 'Document',
        'pob' => 'Jakarta',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
    ]);
    $appHost = env('APP_HOST', 'localhost');

    $response = $this->actingAs($user)
        ->post("http://{$company->username}.{$appHost}/bookings/{$booking->id}/travel-documents", [
            'passengers' => [
                [
                    'id' => $passenger->id,
                    'passport_number' => 'TENANT-P123',
                    'passport_issue_date' => '2024-01-01',
                    'passport_expiry_date' => '2030-01-01',
                    'passport_file' => UploadedFile::fake()->create('tenant-passport.pdf', 120, 'application/pdf'),
                    'visa_number' => 'TENANT-VISA',
                    'visa_file' => UploadedFile::fake()->image('tenant-visa.jpg'),
                ],
            ],
        ]);

    $response->assertRedirect();

    $updatedPassenger = $passenger->fresh();
    expect($updatedPassenger->passport_number)->toBe('TENANT-P123')
        ->and($updatedPassenger->visa_number)->toBe('TENANT-VISA')
        ->and($updatedPassenger->passport_file_path)->toStartWith('travel-documents/passports/')
        ->and($updatedPassenger->visa_file_path)->toStartWith('travel-documents/visas/');
});
