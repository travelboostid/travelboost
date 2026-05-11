<?php

namespace App\Actions\Booking;

use App\Models\Booking;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use Illuminate\Support\Facades\DB;

/**
 * Synchronizes the tour_availabilities snapshot for a given schedule slot.
 */
class SyncAvailabilityAction
{
    /**
     * Authoritative mapping from booking status backing value to snapshot column.
     *
     * @var array<string, string>
     */
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

    /**
     * Statuses that are intentionally not booking-derived availability columns.
     *
     * @var list<string>
     */
    private const IGNORED_STATUSES = ['manual reserved'];

    /**
     * Snapshot columns that reduce available seat count.
     *
     * @var list<string>
     */
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
            ->first();

        if (! $schedule) {
            logger()->warning('SyncAvailabilityAction: missing schedule for booking sync', [
                'booking_id' => $booking->id,
                'tour_id' => $booking->tour_id,
                'departure_date' => $departureDate,
                'company_id' => $booking->vendor_id,
            ]);

            return;
        }

        $hasAvailability = TourAvailability::where('company_id', $booking->vendor_id)
            ->where('tour_id', $booking->tour_id)
            ->where('schedule_id', $schedule->id)
            ->exists();

        if (! $hasAvailability) {
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

    public function execute(int $tourId, string $departureDate, int $companyId): void
    {
        DB::transaction(function () use ($tourId, $departureDate, $companyId) {
            $schedule = TourSchedule::where('tour_id', $tourId)
                ->whereDate('departure_date', $departureDate)
                ->where('company_id', $companyId)
                ->firstOrFail();

            $availability = TourAvailability::where([
                'company_id' => $companyId,
                'tour_id' => $tourId,
                'schedule_id' => $schedule->id,
            ])->lockForUpdate()->firstOrFail();

            $totals = Booking::query()
                ->select('status', DB::raw('COALESCE(SUM(pax_adult + pax_child), 0) as total_pax'))
                ->where('tour_id', $tourId)
                ->where('vendor_id', $companyId)
                ->whereDate('departure_date', $departureDate)
                ->groupBy('status')
                ->get()
                ->keyBy('status');

            $snapshotValues = array_fill_keys(array_unique(array_values(self::STATUS_COLUMN_MAP)), 0);
            $snapshotValues['RS'] = (int) $availability->RS;

            foreach (self::STATUS_COLUMN_MAP as $statusValue => $columnKey) {
                $row = $totals->get($statusValue);
                $snapshotValues[$columnKey] += $row ? (int) $row->total_pax : 0;
            }

            foreach ($totals->keys() as $statusValue) {
                if (! isset(self::STATUS_COLUMN_MAP[$statusValue]) && ! in_array($statusValue, self::IGNORED_STATUSES, true)) {
                    logger()->warning('SyncAvailabilityAction: unrecognized booking status encountered', [
                        'status' => $statusValue,
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
        });
    }
}
