<?php

use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\WaitingList\ExpireWaitingListOffersAction;
use App\Actions\WaitingList\OfferWaitingListSeatAction;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Payment;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;

require_once __DIR__.'/../Support/WaitingListTestHelpers.php';

use Tests\TestCase;

beforeEach(function () {
    /** @var TestCase $this */
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
});

test('waiting list is fulfilled after booking payment is finalized', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $booking = Booking::query()->findOrFail($entry->fresh()->booking_id);
    $booking->update([
        'grand_total' => 5_000_000,
        'total_price' => 5_000_000,
        'pax_adult' => 2,
    ]);

    $payment = Payment::query()->create([
        'owner_type' => Company::class,
        'owner_id' => $vendor->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 5_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => [
            'booking_payment_type' => 'full_payment',
            'payment_type' => 'full_payment',
            'counts_toward_booking_total' => true,
        ],
        'paid_at' => now(),
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $payment, notify: false);

    $waitingList = $waitingList->fresh();
    $entry = $entry->fresh();

    expect($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT)
        ->and($entry->status)->toBe(TourWaitingListScheduleStatus::FULFILLED)
        ->and($waitingList->status)->toBe(TourWaitingListStatus::FULFILLED)
        ->and($waitingList->booking_id)->toBe($booking->id)
        ->and($waitingList->fulfilled_at)->not->toBeNull();
});

test('fulfilled waiting list schedule is returned without offer link', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    createTenantDomain($vendor);
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $booking = Booking::query()->findOrFail($entry->fresh()->booking_id);
    $booking->update([
        'grand_total' => 5_000_000,
        'total_price' => 5_000_000,
        'pax_adult' => 2,
    ]);

    $payment = Payment::query()->create([
        'owner_type' => Company::class,
        'owner_id' => $vendor->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 5_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => [
            'booking_payment_type' => 'full_payment',
            'payment_type' => 'full_payment',
            'counts_toward_booking_total' => true,
        ],
        'paid_at' => now(),
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $payment, notify: false);

    $response = $this->actingAs($customer)->get('/mybookings?tab=waiting_list');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('waitingLists.data.0.schedules.0.status', 'fulfilled')
        ->where('waitingLists.data.0.schedules.0.complete_booking_href', null)
    );
});

test('booking create prefill loads waiting list offer booking', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    createTenantDomain($vendor);
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);
    $booking = Booking::query()->findOrFail($entry->fresh()->booking_id);
    $appHost = env('APP_HOST', 'localhost');

    $response = $this->actingAs($customer)->get(
        "http://{$vendor->username}.{$appHost}/bookings/{$tour->id}/create?".http_build_query([
            'waiting_list_schedule_id' => $entry->id,
        ]),
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('bookingNumber', $booking->booking_number)
        ->where('isResumingExistingBooking', true)
        ->where('isWaitingListBooking', true)
    );
});

test('booking create by booking number still marks waiting list offer booking', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    createTenantDomain($vendor);
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);
    $booking = Booking::query()->findOrFail($entry->fresh()->booking_id);
    $appHost = env('APP_HOST', 'localhost');

    $response = $this->actingAs($customer)->get(
        "http://{$vendor->username}.{$appHost}/bookings/{$tour->id}/create?".http_build_query([
            'date' => $booking->departure_date?->format('Y-m-d'),
            'booking_number' => $booking->booking_number,
        ]),
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('bookingNumber', $booking->booking_number)
        ->where('isResumingExistingBooking', true)
        ->where('isWaitingListBooking', true)
    );
});

test('fulfilled waiting list booking appears on current bookings tab', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    createTenantDomain($vendor);
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $booking = Booking::query()->findOrFail($entry->fresh()->booking_id);
    $booking->update([
        'grand_total' => 5_000_000,
        'total_price' => 5_000_000,
        'pax_adult' => 2,
    ]);

    $payment = Payment::query()->create([
        'owner_type' => Company::class,
        'owner_id' => $vendor->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 5_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => [
            'booking_payment_type' => 'full_payment',
            'payment_type' => 'full_payment',
            'counts_toward_booking_total' => true,
        ],
        'paid_at' => now(),
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $payment, notify: false);

    $response = $this->actingAs($customer)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('me/bookings')
        ->where('activeTab', 'current')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.booking_number', $booking->booking_number)
    );
});

test('offer expiry job expires schedule and frees booking when offer_expires_at is set', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $entry = $entry->fresh();
    expect($entry->offer_expires_at)->not->toBeNull();

    // Backdate the expiry to simulate a timed-out offer
    $entry->update(['offer_expires_at' => now()->subMinute()]);

    $expiredCount = app(ExpireWaitingListOffersAction::class)->execute();

    expect($expiredCount)->toBe(1);
    expect($entry->fresh()->status)->toBe(TourWaitingListScheduleStatus::EXPIRED);
    expect(Booking::query()->find($entry->booking_id)?->status)
        ->toBe(BookingStatus::EXPIRED);
});

test('booking create by booking number still marks waiting list offer booking when reserved type was overwritten', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    createTenantDomain($vendor);
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);
    $booking = Booking::query()->findOrFail($entry->fresh()->booking_id);
    $booking->update(['reserved_type' => 'system']);
    $appHost = env('APP_HOST', 'localhost');

    $response = $this->actingAs($customer)->get(
        "http://{$vendor->username}.{$appHost}/bookings/{$tour->id}/create?".http_build_query([
            'date' => $booking->departure_date?->format('Y-m-d'),
            'booking_number' => $booking->booking_number,
        ]),
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('bookingNumber', $booking->booking_number)
        ->where('isResumingExistingBooking', true)
        ->where('isWaitingListBooking', true)
    );
});
