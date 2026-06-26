<?php

use App\Actions\WaitingList\OfferWaitingListSeatAction;
use App\Enums\BookingStatus;
use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\Company;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\Notification;

require_once __DIR__.'/../Support/WaitingListTestHelpers.php';

use App\Models\Booking;
use Illuminate\Support\Carbon;
use Tests\TestCase;

beforeEach(function () {
    /** @var TestCase $this */
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
});

test('customer only sees their own waiting lists on mybookings tab', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 0);

    $customer = User::factory()->create();
    $customer->addRole('user:customer');
    $otherCustomer = User::factory()->create();
    $otherCustomer->addRole('user:customer');

    createCustomerWaitingList($tour, $customer, $schedule->id);
    createCustomerWaitingList($tour, $otherCustomer, $schedule->id);

    $response = $this->actingAs($customer)->get('/mybookings?tab=waiting_list');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('me/bookings')
        ->where('activeTab', 'waiting_list')
        ->has('waitingLists.data', 1)
        ->where('waitingLists.data.0.contact_name', $customer->name)
        ->where('waitingLists.data.0.can_edit', true)
        ->where('waitingLists.data.0.can_cancel', true)
    );
});

test('customer waiting list payload includes offer link without queue position', function () {
    Notification::fake();

    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');

    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $response = $this->actingAs($customer)->get('/mybookings?tab=waiting_list');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('waitingLists.data.0.schedules.0.complete_booking_href')
        ->where('waitingLists.data.0.schedules.0.status', 'offered')
        ->where('waitingLists.data.0.schedules.0.queue_position', null)
        ->where('waitingLists.data.0.can_edit', false)
        ->where('waitingLists.data.0.can_cancel', false)
    );
});

test('customer waiting list payload hides offer link when linked booking is no longer actionable', function () {
    Notification::fake();

    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');

    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $bookingId = $entry->fresh()->booking_id;

    Booking::query()
        ->whereKey($bookingId)
        ->update(['status' => BookingStatus::CANCELLED]);

    $response = $this->actingAs($customer)->get('/mybookings?tab=waiting_list');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('waitingLists.data.0.schedules.0.status', 'offered')
        ->where('waitingLists.data.0.schedules.0.complete_booking_href', null)
    );
});

test('customer waiting list offer link works on agent subdomain', function () {
    Notification::fake();

    ['tour' => $tour] = waitingListTourFixture();
    $agent = Company::factory()->create(['type' => 'agent', 'username' => 'offeragent']);
    createTenantDomain($agent);
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');

    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $offeredEntry = $entry->fresh();
    $booking = Booking::query()->findOrFail($offeredEntry->booking_id);
    $departureDate = Carbon::parse($schedule->departure_date)->format('Y-m-d');

    $response = $this->actingAs($customer)->get(
        "http://{$agent->username}.lvh.me/mybookings?tab=waiting_list",
    );

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where(
            'waitingLists.data.0.schedules.0.complete_booking_href',
            '/bookings/'.$tour->id.'/create?'.http_build_query([
                'date' => $departureDate,
                'booking_number' => $booking->booking_number,
                'waiting_list_schedule_id' => $offeredEntry->id,
            ]),
        )
    );
});

test('customer can cancel an active queued waiting list', function () {
    ['tour' => $tour, 'vendor' => $vendor] = waitingListTourFixture();
    $agent = Company::factory()->create(['type' => 'agent']);
    createTenantDomain($agent);
    $schedule = waitingListScheduleFixture($tour, available: 0);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');

    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id);

    $response = $this->actingAs($customer)->patch(
        "http://{$agent->username}.lvh.me/waiting-lists/{$waitingList->id}/cancel",
    );

    $response->assertRedirect();
    $waitingList->refresh();

    expect($waitingList->status)->toBe(TourWaitingListStatus::CANCELLED);
    expect($waitingList->schedules->first()->status)->toBe(TourWaitingListScheduleStatus::CANCELLED);
});

test('customer can update contact and pax on queued waiting list', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $agent = Company::factory()->create(['type' => 'agent']);
    createTenantDomain($agent);
    $schedule = waitingListScheduleFixture($tour, available: 0);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');

    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    $response = $this->actingAs($customer)->patch(
        "http://{$agent->username}.lvh.me/waiting-lists/{$waitingList->id}",
        [
            'contact_name' => 'Updated Name',
            'contact_phone' => '081111111111',
            'contact_email' => 'updated@example.com',
            'contact_address' => 'New address',
            'schedules' => [
                [
                    'id' => $entry->id,
                    'pax_adult' => 4,
                    'pax_child' => 1,
                    'pax_infant' => 0,
                ],
            ],
        ],
    );

    $response->assertRedirect();
    $waitingList->refresh();
    $entry->refresh();

    expect($waitingList->contact_name)->toBe('Updated Name');
    expect($entry->pax_adult)->toBe(4);
    expect($entry->pax_child)->toBe(1);
});

test('customer cannot update waiting list when seats are already available for pax', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $agent = Company::factory()->create(['type' => 'agent']);
    createTenantDomain($agent);
    $schedule = waitingListScheduleFixture($tour, available: 5);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');

    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 6);
    $entry = $waitingList->schedules->first();

    $this->actingAs($customer)
        ->patch(
            "http://{$agent->username}.lvh.me/waiting-lists/{$waitingList->id}",
            [
                'contact_name' => 'Jane',
                'contact_phone' => '0812312312',
                'contact_email' => 'jane@example.com',
                'contact_address' => 'Jakarta',
                'schedules' => [
                    [
                        'id' => $entry->id,
                        'pax_adult' => 2,
                        'pax_child' => 0,
                        'pax_infant' => 0,
                    ],
                ],
            ],
        )
        ->assertSessionHasErrors('schedules.0.pax_adult');
});

test('customer cannot cancel another users waiting list', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $agent = Company::factory()->create(['type' => 'agent']);
    createTenantDomain($agent);
    $schedule = waitingListScheduleFixture($tour, available: 0);

    $owner = User::factory()->create();
    $owner->addRole('user:customer');
    $attacker = User::factory()->create();
    $attacker->addRole('user:customer');

    $waitingList = createCustomerWaitingList($tour, $owner, $schedule->id);

    $this->actingAs($attacker)
        ->patch("http://{$agent->username}.lvh.me/waiting-lists/{$waitingList->id}/cancel")
        ->assertForbidden();
});

test('booking on current tab shows cancelled status when linked waiting list schedule is cancelled', function () {
    Notification::fake();

    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');

    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $bookingId = $entry->fresh()->booking_id;

    // Simulate the vendor cancelling the offer: the booking remains BOOKING_RESERVED
    // but the WL schedule is marked cancelled. The controller must overlay the display status.
    $entry->fresh()->update(['status' => TourWaitingListScheduleStatus::CANCELLED]);

    $response = $this->actingAs($customer)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('bookings.data.0.status', 'cancelled')
        ->where('bookings.data.0.can_continue_booking', false)
        ->where('bookings.data.0.can_reorder', false)
    );

    expect(Booking::query()->find($bookingId)?->status)->toBe(BookingStatus::BOOKING_RESERVED);
});

test('booking on current tab shows expired status and blocks reorder when waiting list schedule expires while booking is awaiting payment', function () {
    Notification::fake();

    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');

    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $bookingId = $entry->fresh()->booking_id;

    // Customer has started the payment flow: booking advances to AWAITING_PAYMENT.
    // ExpireWaitingListOffersAction only expires bookings still in BOOKING_RESERVED,
    // so this booking keeps its AWAITING_PAYMENT status even after the WL offer expires.
    Booking::query()->whereKey($bookingId)->update(['status' => BookingStatus::AWAITING_PAYMENT]);
    $entry->fresh()->update(['status' => TourWaitingListScheduleStatus::EXPIRED]);

    $response = $this->actingAs($customer)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('bookings.data.0.status', 'expired')
        ->where('bookings.data.0.can_continue_booking', false)
        ->where('bookings.data.0.can_reorder', false)
    );
});

test('plain expired booking without waiting list schedule can reorder when schedule is still bookable', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $tourSchedule = waitingListScheduleFixture($tour, available: 5, departureInDays: 30);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');

    // A regular booking (not waiting-list-linked) that expired — can_reorder should be
    // controlled only by bookingScheduleIsBookable, not by hasClosedWaitingListOffer.
    Booking::query()->create([
        'booking_number' => 'TEST-PLAIN-001',
        'user_id' => $customer->id,
        'tour_id' => $tour->id,
        'vendor_id' => $tour->company_id,
        'departure_date' => $tourSchedule->departure_date,
        'status' => BookingStatus::EXPIRED,
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => 0,
        'tax_rate' => 0,
        'tax_amount' => 0,
        'platform_fee' => 0,
        'commission_amount' => 0,
        'grand_total' => 0,
        'input_by_user_id' => $customer->id,
        'input_by_role' => 'customer',
    ]);

    $response = $this->actingAs($customer)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('bookings.data.0.status', 'expired')
        ->where('bookings.data.0.can_reorder', true)
    );
});
