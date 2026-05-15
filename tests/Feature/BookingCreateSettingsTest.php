<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Domain;
use App\Models\Tour;
use App\Models\TourAvailability;
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

test('booking create passes vendor settings to the frontend and applies schedule deadline', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'username' => 'deadlinevendor',
        'type' => 'vendor',
    ]);
    $company->companySetting()->update([
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
            'departure_date' => now()->addDays(20)->toDateString(),
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
    $company->companySetting()->update([
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
        ->where('isResumingExistingBooking', false));
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
        ->where('existingBooking.booking_number', 'BKG-REORDER-ENDPOINT'));
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
