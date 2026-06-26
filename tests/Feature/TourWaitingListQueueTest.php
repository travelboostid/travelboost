<?php

use App\Actions\Booking\SyncAvailabilityAction;
use App\Actions\WaitingList\ExpireWaitingListOffersAction;
use App\Actions\WaitingList\OfferWaitingListSeatAction;
use App\Actions\WaitingList\PickNextWaitingListCandidateAction;
use App\Actions\WaitingList\ProcessWaitingListOffersForScheduleAction;
use App\Actions\WaitingList\ReorderWaitingListQueueAction;
use App\Actions\WaitingList\ResolveWaitingListQueuePositionAction;
use App\Enums\BookingStatus;
use App\Enums\TourWaitingListScheduleStatus;
use App\Jobs\SendWaitingListOfferNotificationJob;
use App\Models\Booking;
use App\Models\TourAvailability;
use App\Models\TourWaitingList;
use App\Models\TourWaitingListSchedule;
use App\Models\User;
use App\Notifications\WaitingListSeatAvailableNotification;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\Notification;
use Symfony\Component\Mailer\Exception\TransportException;

require_once __DIR__.'/../Support/WaitingListTestHelpers.php';

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('pick next waiting list candidate respects fifo order', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 3);
    $customerA = User::factory()->create();
    $customerB = User::factory()->create();

    createCustomerWaitingList($tour, $customerA, $schedule->id, adult: 2);
    TourWaitingList::query()->where('customer_user_id', $customerA->id)->update(['created_at' => now()->subHour()]);
    createCustomerWaitingList($tour, $customerB, $schedule->id, adult: 2);

    $candidate = app(PickNextWaitingListCandidateAction::class)->execute($schedule->id, 3);

    expect($candidate?->waitingList?->customer_user_id)->toBe($customerA->id);
});

test('pick next waiting list candidate skips party that does not fit', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 3);
    $customerA = User::factory()->create();
    $customerB = User::factory()->create();

    createCustomerWaitingList($tour, $customerA, $schedule->id, adult: 4);
    TourWaitingList::query()->where('customer_user_id', $customerA->id)->update(['created_at' => now()->subHour()]);
    createCustomerWaitingList($tour, $customerB, $schedule->id, adult: 3);

    $candidate = app(PickNextWaitingListCandidateAction::class)->execute($schedule->id, 3);

    expect($candidate?->waitingList?->customer_user_id)->toBe($customerB->id);
});

test('manual queue position overrides fifo ordering', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 3);
    $customerA = User::factory()->create();
    $customerB = User::factory()->create();

    $first = createCustomerWaitingList($tour, $customerA, $schedule->id, adult: 2);
    TourWaitingList::query()->where('customer_user_id', $customerA->id)->update(['created_at' => now()->subHour()]);
    $second = createCustomerWaitingList($tour, $customerB, $schedule->id, adult: 2);

    $secondSchedule = $second->schedules->first();
    $secondSchedule->update(['manual_queue_position' => 1]);
    $first->schedules->first()->update(['manual_queue_position' => 2]);

    $candidate = app(PickNextWaitingListCandidateAction::class)->execute($schedule->id, 3);

    expect($candidate?->id)->toBe($secondSchedule->id);
});

test('reorder waiting list queue updates manual positions', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 0);
    $customerA = User::factory()->create();
    $customerB = User::factory()->create();

    $first = createCustomerWaitingList($tour, $customerA, $schedule->id)->schedules->first();
    $second = createCustomerWaitingList($tour, $customerB, $schedule->id)->schedules->first();

    app(ReorderWaitingListQueueAction::class)->execute($schedule->id, [$second->id, $first->id]);

    expect($second->fresh()->manual_queue_position)->toBe(1)
        ->and($first->fresh()->manual_queue_position)->toBe(2)
        ->and(app(ResolveWaitingListQueuePositionAction::class)->execute($second->fresh()))->toBe(1);
});

test('offer waiting list seat creates provisional booking and reduces availability', function () {
    Notification::fake();

    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $entry = $entry->fresh();
    $availability = TourAvailability::query()->where('schedule_id', $schedule->id)->first();

    expect($entry->status)->toBe(TourWaitingListScheduleStatus::OFFERED)
        ->and($entry->booking_id)->not->toBeNull()
        ->and($entry->offered_seats)->toBe(2)
        ->and((int) $availability?->BRS)->toBe(2)
        ->and((int) $availability?->available)->toBe(8);

    $booking = Booking::query()->findOrFail($entry->booking_id);
    expect($booking->status)->toBe(BookingStatus::BOOKING_RESERVED)
        ->and($booking->reserved_type)->toBe('waiting_list_offer');

    Notification::assertSentTo($customer, WaitingListSeatAvailableNotification::class);

    expect($entry->offer_expires_at)->not->toBeNull();
});

test('expired waiting list offer cascades to the next fitting candidate', function () {
    Notification::fake();

    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 3);
    $customerA = User::factory()->create();
    $customerB = User::factory()->create();
    $customerA->addRole('user:customer');
    $customerB->addRole('user:customer');

    $entryA = createCustomerWaitingList($tour, $customerA, $schedule->id, adult: 3)->schedules->first();
    TourWaitingList::query()->where('customer_user_id', $customerA->id)->update(['created_at' => now()->subHour()]);
    createCustomerWaitingList($tour, $customerB, $schedule->id, adult: 3);

    app(OfferWaitingListSeatAction::class)->execute($entryA);
    $entryA = $entryA->fresh();
    $entryA->update(['offer_expires_at' => now()->subMinute()]);

    app(ExpireWaitingListOffersAction::class)->expireScheduleOffer($entryA->id);

    $offeredToB = TourWaitingListSchedule::query()
        ->where('tour_schedule_id', $schedule->id)
        ->where('status', TourWaitingListScheduleStatus::OFFERED)
        ->whereHas('waitingList', fn ($query) => $query->where('customer_user_id', $customerB->id))
        ->exists();

    expect($entryA->fresh()->status)->toBe(TourWaitingListScheduleStatus::EXPIRED)
        ->and($offeredToB)->toBeTrue();
});

test('sync availability triggers waiting list auto offer when seats become available', function () {
    Notification::fake();

    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 0, departureInDays: 30);

    $booking = Booking::factory()->create([
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'vendor_id' => $vendor->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'pax_adult' => 10,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);

    app(SyncAvailabilityAction::class)->execute(
        (int) $tour->id,
        (string) $schedule->departure_date,
        (int) $vendor->id,
    );

    expect((int) TourAvailability::query()->where('schedule_id', $schedule->id)->value('available'))->toBe(0);

    $customer = User::factory()->create();
    createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);

    $booking->update(['status' => BookingStatus::CANCELLED]);

    app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());

    expect(
        TourWaitingListSchedule::query()
            ->where('tour_schedule_id', $schedule->id)
            ->where('status', TourWaitingListScheduleStatus::OFFERED)
            ->exists()
    )->toBeTrue();
});

test('process waiting list offers for schedule auto offers when seats are available', function () {
    Notification::fake();

    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);

    app(ProcessWaitingListOffersForScheduleAction::class)->execute($schedule->id);

    expect(
        TourWaitingListSchedule::query()
            ->where('tour_schedule_id', $schedule->id)
            ->where('status', TourWaitingListScheduleStatus::OFFERED)
            ->exists()
    )->toBeTrue();
});

test('waiting list seat notification builds a valid booking action url', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules()->firstOrFail();
    $booking = Booking::factory()->create([
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'user_id' => $customer->id,
    ]);

    $notification = new WaitingListSeatAvailableNotification(
        $entry->load(['waitingList.tour', 'tourSchedule']),
        $booking,
        now()->addDay(),
    );

    $payload = $notification->toArray($customer);

    expect($payload['action_url'])
        ->toContain('/bookings/'.$tour->id.'/create?date=')
        ->not->toContain('NULL');
});

test('waiting list offer notification job does not fail when mail delivery is rejected', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $customer = User::factory()->create();
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules()->firstOrFail();
    $offerExpiresAt = now()->addDay();
    $entry->update(['offer_expires_at' => $offerExpiresAt]);

    $booking = Booking::factory()->create([
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'user_id' => $customer->id,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'waiting_list_offer',
        'reserved_expires_at' => $offerExpiresAt,
    ]);

    Notification::shouldReceive('send')
        ->once()
        ->andThrow(new TransportException(
            'Expected response code "250" but got code "554", with message "554 5.7.1 Disabled by user from hPanel".',
        ));

    $job = new SendWaitingListOfferNotificationJob(
        $entry->fresh(['waitingList']),
        $booking->fresh(),
    );

    $job->handle();

    expect($entry->fresh()->offer_expires_at?->toDateTimeString())
        ->toBe($offerExpiresAt->toDateTimeString())
        ->and($booking->fresh()->reserved_expires_at?->toDateTimeString())
        ->toBe($offerExpiresAt->toDateTimeString());
});
