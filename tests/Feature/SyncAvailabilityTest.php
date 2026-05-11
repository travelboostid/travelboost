<?php

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingStatus;
use App\Jobs\SyncTourAvailabilityJob;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->company = Company::factory()->create();
    $this->tour = Tour::factory()->create([
        'company_id' => $this->company->id,
        'continent_id' => null,
        'region_id' => null,
        'country_id' => null,
    ]);
    $this->departureDate = now()->addWeek()->toDateString();

    $this->schedule = TourSchedule::create([
        'tour_id' => $this->tour->id,
        'tour_code' => $this->tour->code,
        'company_id' => $this->company->id,
        'departure_date' => $this->departureDate,
        'return_date' => now()->addWeeks(2)->toDateString(),
        'is_active' => true,
    ]);

    $this->availability = TourAvailability::create([
        'company_id' => $this->company->id,
        'tour_id' => $this->tour->id,
        'schedule_id' => $this->schedule->id,
        'max_pax' => 30,
        'WP' => 0,
        'WPA' => 0,
        'DP' => 0,
        'FP' => 0,
        'RS' => 0,
        'BRS' => 0,
        'CA' => 0,
        'RF' => 0,
        'EX' => 0,
        'WL' => 0,
        'available' => 30,
    ]);
});

test('creating a booking dispatches the sync job', function () {
    Queue::fake();

    Booking::factory()->create([
        'tour_id' => $this->tour->id,
        'departure_date' => $this->departureDate,
        'vendor_id' => $this->company->id,
        'status' => BookingStatus::RESERVED,
        'pax_adult' => 2,
        'pax_child' => 1,
    ]);

    Queue::assertPushed(SyncTourAvailabilityJob::class, function ($job) {
        return $job->tourId === $this->tour->id
            && $job->departureDate === $this->departureDate
            && $job->companyId === $this->company->id;
    });
});

test('booking with null vendor_id does not dispatch', function () {
    Queue::fake();

    Booking::factory()->create([
        'tour_id' => $this->tour->id,
        'departure_date' => $this->departureDate,
        'vendor_id' => null,
        'status' => BookingStatus::RESERVED,
    ]);

    Queue::assertNotPushed(SyncTourAvailabilityJob::class);
});

test('updating booking status dispatches the sync job', function () {
    Queue::fake();

    $booking = Booking::factory()->create([
        'tour_id' => $this->tour->id,
        'departure_date' => $this->departureDate,
        'vendor_id' => $this->company->id,
        'status' => BookingStatus::RESERVED,
    ]);

    Queue::assertPushed(SyncTourAvailabilityJob::class);
    Queue::fake();

    $booking->update(['status' => BookingStatus::CANCELLED]);

    Queue::assertPushed(SyncTourAvailabilityJob::class);
});

test('key-shift on update dispatches for both old and new keys', function () {
    Queue::fake();

    $otherCompany = Company::factory()->create();
    TourSchedule::create([
        'tour_id' => $this->tour->id,
        'tour_code' => $this->tour->code,
        'company_id' => $otherCompany->id,
        'departure_date' => $this->departureDate,
        'return_date' => now()->addWeeks(2)->toDateString(),
        'is_active' => true,
    ]);

    $booking = Booking::factory()->create([
        'tour_id' => $this->tour->id,
        'departure_date' => $this->departureDate,
        'vendor_id' => $this->company->id,
        'status' => BookingStatus::RESERVED,
    ]);

    Queue::fake();

    $booking->update(['vendor_id' => $otherCompany->id]);

    Queue::assertPushed(SyncTourAvailabilityJob::class, 2);

    $dispatched = [];
    Queue::assertPushed(SyncTourAvailabilityJob::class, function ($job) use (&$dispatched) {
        $dispatched[] = $job->companyId;

        return true;
    });

    expect($dispatched)->toContain($this->company->id)
        ->and($dispatched)->toContain($otherCompany->id);
});

test('SyncAvailabilityAction correctly computes snapshot columns and available', function () {
    $this->availability->update(['RS' => 1]);

    Booking::withoutEvents(function () {
        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::RESERVED,
            'pax_adult' => 2,
            'pax_child' => 1,
        ]);

        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::AWAITING_PAYMENT,
            'pax_adult' => 4,
            'pax_child' => 0,
        ]);

        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => 'waiting payment approval',
            'pax_adult' => 3,
            'pax_child' => 0,
        ]);

        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => 'booking reserved',
            'pax_adult' => 1,
            'pax_child' => 1,
        ]);

        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => 'manual reserved',
            'pax_adult' => 4,
            'pax_child' => 0,
        ]);

        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::DOWN_PAYMENT,
            'pax_adult' => 2,
            'pax_child' => 0,
        ]);

        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::FULL_PAYMENT,
            'pax_adult' => 1,
            'pax_child' => 0,
        ]);

        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::CANCELLED,
            'pax_adult' => 1,
            'pax_child' => 0,
        ]);

        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::REFUNDED,
            'pax_adult' => 2,
            'pax_child' => 0,
        ]);

        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::EXPIRED,
            'pax_adult' => 1,
            'pax_child' => 0,
        ]);

        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::WAITING_LIST,
            'pax_adult' => 1,
            'pax_child' => 1,
        ]);
    });

    $action = app(SyncAvailabilityAction::class);
    $action->execute($this->tour->id, $this->departureDate, $this->company->id);

    $this->availability->refresh();

    expect((int) $this->availability->BRS)->toBe(5)
        ->and((int) $this->availability->RS)->toBe(1)
        ->and((int) $this->availability->WP)->toBe(4)
        ->and((int) $this->availability->WPA)->toBe(3)
        ->and((int) $this->availability->CA)->toBe(1)
        ->and((int) $this->availability->RF)->toBe(2)
        ->and((int) $this->availability->EX)->toBe(1)
        ->and((int) $this->availability->WL)->toBe(2)
        ->and((int) $this->availability->DP)->toBe(2)
        ->and((int) $this->availability->FP)->toBe(1)
        ->and((float) $this->availability->available)->toBe(18.0);
});

test('booking reserved expires without changing manual reserved holds', function () {
    $this->availability->update([
        'RS' => 1,
        'available' => 29,
    ]);

    $booking = Booking::withoutEvents(function () {
        return Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::BOOKING_RESERVED,
            'reserved_type' => 'system',
            'reserved_expires_at' => now()->subSecond(),
            'pax_adult' => 2,
            'pax_child' => 1,
        ]);
    });

    app(ExpireBookingReservationsAction::class)->execute();

    $this->availability->refresh();

    expect($booking->fresh()->status)->toBe(BookingStatus::EXPIRED)
        ->and((int) $this->availability->RS)->toBe(1)
        ->and((int) $this->availability->BRS)->toBe(0)
        ->and((int) $this->availability->EX)->toBe(3)
        ->and((float) $this->availability->available)->toBe(29.0);
});

test('booking reserved does not expire before server hold deadline', function () {
    $booking = Booking::withoutEvents(function () {
        return Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::BOOKING_RESERVED,
            'reserved_type' => 'system',
            'reserved_expires_at' => now()->addMinute(),
            'pax_adult' => 2,
            'pax_child' => 1,
        ]);
    });

    app(ExpireBookingReservationsAction::class)->execute();

    expect($booking->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED);
});

test('booking reserved holds reduce availability without changing manual reserved holds', function () {
    $this->availability->update(['RS' => 1]);

    Booking::withoutEvents(function () {
        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::BOOKING_RESERVED,
            'reserved_type' => 'system',
            'reserved_expires_at' => now()->addMinutes(10),
            'pax_adult' => 2,
            'pax_child' => 1,
        ]);
    });

    app(SyncAvailabilityAction::class)->execute($this->tour->id, $this->departureDate, $this->company->id);

    $this->availability->refresh();

    expect((int) $this->availability->RS)->toBe(1)
        ->and((int) $this->availability->BRS)->toBe(3)
        ->and((float) $this->availability->available)->toBe(26.0);
});

test('SyncAvailabilityAction floors available to zero on oversell', function () {
    $this->availability->update(['max_pax' => 2]);

    Booking::withoutEvents(function () {
        Booking::factory()->create([
            'tour_id' => $this->tour->id,
            'departure_date' => $this->departureDate,
            'vendor_id' => $this->company->id,
            'status' => BookingStatus::RESERVED,
            'pax_adult' => 3,
            'pax_child' => 2,
        ]);
    });

    $action = app(SyncAvailabilityAction::class);
    $action->execute($this->tour->id, $this->departureDate, $this->company->id);

    $this->availability->refresh();

    expect((int) $this->availability->BRS)->toBe(5)
        ->and((float) $this->availability->available)->toBe(0.0);
});

test('deleting a booking dispatches the sync job', function () {
    Queue::fake();

    $booking = Booking::factory()->create([
        'tour_id' => $this->tour->id,
        'departure_date' => $this->departureDate,
        'vendor_id' => $this->company->id,
        'status' => BookingStatus::RESERVED,
    ]);

    Queue::fake();

    $booking->delete();

    Queue::assertPushed(SyncTourAvailabilityJob::class);
});
