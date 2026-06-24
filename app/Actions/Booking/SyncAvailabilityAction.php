<?php

namespace App\Actions\Booking;

use App\Models\Booking;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use Illuminate\Support\Facades\DB;

class SyncAvailabilityAction
{
    private const STATUS_COLUMN_MAP = [
        'awaiting payment' => 'WP',
        'waiting payment approval' => 'WPA',
        'down payment' => 'DP',
        'full payment' => 'FP',
        'reserved' => 'BRS',
        'booking reserved' => 'BRS',
        'cancelled' => 'CA',
        'refunded' => 'RF',
        'expired' => 'EX',
        'waiting list' => 'WL',
    ];

    private const IGNORED_STATUSES = ['manual reserved'];

    private const AVAILABILITY_COLUMNS = ['DP', 'FP', 'RS', 'BRS', 'WPA'];

    public function executeForBooking(Booking $booking): void
    {
        if (! $booking->vendor_id || ! $booking->tour_id || ! $booking->departure_date) {
            return;
        }

        $departureDate = $booking->departure_date instanceof \DateTimeInterface
            ? $booking->departure_date->format('Y-m-d')
            : (string) $booking->departure_date;

        $schedule = TourSchedule::where('tour_id', $booking->tour_id)
            ->whereDate('departure_date', $departureDate)
            ->where('company_id', $booking->vendor_id)
            ->whereHas('availability', function ($query) use ($booking): void {
                $query
                    ->where('company_id', $booking->vendor_id)
                    ->where('tour_id', $booking->tour_id);
            })
            ->orderBy('id')
            ->first();

        if (! $schedule) {
            logger()->warning('SyncAvailabilityAction: missing availability row for booking sync', [
                'booking_id' => $booking->id,
                'tour_id' => $booking->tour_id,
                'departure_date' => $departureDate,
                'company_id' => $booking->vendor_id,
            ]);

            return;
        }

        $this->execute((int) $booking->tour_id, $departureDate, (int) $booking->vendor_id);
    }

    public function syncAllSchedulesForTour(int $tourId, int $companyId): void
    {
        TourSchedule::query()
            ->where('tour_id', $tourId)
            ->where('company_id', $companyId)
            ->whereHas('availability', function ($query) use ($tourId, $companyId): void {
                $query
                    ->where('company_id', $companyId)
                    ->where('tour_id', $tourId);
            })
            ->orderBy('id')
            ->each(function (TourSchedule $schedule) use ($companyId): void {
                $this->syncSchedule($schedule, $companyId);
            });
    }

    public function execute(int $tourId, string $departureDate, int $companyId): void
    {
        $schedules = TourSchedule::query()
            ->where('tour_id', $tourId)
            ->whereDate('departure_date', $departureDate)
            ->where('company_id', $companyId)
            ->whereHas('availability', function ($query) use ($tourId, $companyId): void {
                $query
                    ->where('company_id', $companyId)
                    ->where('tour_id', $tourId);
            })
            ->orderBy('id')
            ->get();

        if ($schedules->isEmpty()) {
            logger()->warning('SyncAvailabilityAction: missing schedule row for direct availability sync', [
                'tour_id' => $tourId,
                'departure_date' => $departureDate,
                'company_id' => $companyId,
            ]);

            return;
        }

        foreach ($schedules as $schedule) {
            $this->syncSchedule($schedule, $companyId);
        }
    }

    public function syncSchedule(TourSchedule $schedule, int $companyId): void
    {
        $departureDate = $schedule->departure_date instanceof \DateTimeInterface
            ? $schedule->departure_date->format('Y-m-d')
            : (string) $schedule->departure_date;

        DB::transaction(function () use ($schedule, $departureDate, $companyId): void {
            $availability = TourAvailability::where([
                'company_id' => $companyId,
                'tour_id' => $schedule->tour_id,
                'schedule_id' => $schedule->id,
            ])->lockForUpdate()->first();

            if (! $availability) {
                logger()->warning('SyncAvailabilityAction: missing availability row for booking sync', [
                    'tour_id' => $schedule->tour_id,
                    'departure_date' => $departureDate,
                    'company_id' => $companyId,
                    'schedule_id' => $schedule->id,
                ]);

                return;
            }

            $this->syncAvailabilitySnapshot($availability, (int) $schedule->tour_id, $departureDate, $companyId);
        });
    }

    private function syncAvailabilitySnapshot(TourAvailability $availability, int $tourId, string $departureDate, int $companyId): void
    {
        if ($this->manualReservedShouldActivate($availability)) {
            $this->activateManualReserved($availability);
            $availability->refresh();
        }

        if ($this->manualReservedIsExpired($availability)) {
            $availability->update([
                'RS' => 0,
                'available' => (int) ($availability->manual_reserved_original_available ?? $availability->max_pax),
                'manual_reserved_pending_value' => null,
                'manual_reserved_started_at' => null,
                'manual_reserved_expires_at' => null,
                'manual_reserved_original_available' => null,
            ]);

            $availability->refresh();
        }

        $totals = Booking::query()
            ->select('status', DB::raw('COALESCE(SUM(COALESCE(pax_adult, 0) + COALESCE(pax_child, 0)), 0) as total_pax'))
            ->where('tour_id', $tourId)
            ->where('vendor_id', $companyId)
            ->whereDate('departure_date', $departureDate)
            ->groupBy('status')
            ->get()
            ->keyBy(fn ($row) => $row->status instanceof \BackedEnum ? $row->status->value : (string) $row->status);

        $snapshotValues = array_fill_keys(array_unique(array_values(self::STATUS_COLUMN_MAP)), 0);
        $snapshotValues['RS'] = (int) $availability->RS;

        foreach (self::STATUS_COLUMN_MAP as $statusValue => $columnKey) {
            $row = $totals->get($statusValue);
            $snapshotValues[$columnKey] += $row ? (int) $row->total_pax : 0;
        }

        foreach ($totals->keys() as $statusValue) {
            $statusKey = $statusValue instanceof \BackedEnum ? $statusValue->value : (string) $statusValue;

            if (! isset(self::STATUS_COLUMN_MAP[$statusKey]) && ! in_array($statusKey, self::IGNORED_STATUSES, true)) {
                logger()->warning('SyncAvailabilityAction: unrecognized booking status encountered', [
                    'status' => $statusKey,
                    'tour_id' => $tourId,
                    'departure_date' => $departureDate,
                    'company_id' => $companyId,
                ]);
            }
        }

        $reducingTotal = 0;
        foreach (self::AVAILABILITY_COLUMNS as $col) {
            $reducingTotal += $snapshotValues[$col];
        }
        $available = max(0, (float) $availability->max_pax - $reducingTotal);

        $availability->update([
            ...$snapshotValues,
            'available' => $available,
        ]);
    }

    private function manualReservedShouldActivate(TourAvailability $availability): bool
    {
        return (int) ($availability->manual_reserved_pending_value ?? 0) > 0
            && (int) $availability->RS === 0
            && $availability->manual_reserved_started_at !== null
            && $availability->manual_reserved_started_at->lessThanOrEqualTo(now('UTC'));
    }

    private function manualReservedIsExpired(TourAvailability $availability): bool
    {
        return $availability->manual_reserved_expires_at !== null
            && $availability->manual_reserved_expires_at->isPast();
    }

    private function activateManualReserved(TourAvailability $availability): void
    {
        $reservedSeats = (int) ($availability->manual_reserved_pending_value ?? 0);
        $originalAvailable = max(0, (int) $availability->available);

        $availability->update([
            'RS' => $reservedSeats,
            'available' => max(0, $originalAvailable - $reservedSeats),
            'manual_reserved_pending_value' => null,
            'manual_reserved_original_available' => $originalAvailable,
        ]);
    }
}
