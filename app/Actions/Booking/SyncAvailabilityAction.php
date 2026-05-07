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
        'down payment' => 'DP',
        'full payment' => 'FP',
        'reserved' => 'BRS',
        'booking reserved' => 'BRS',
        'manual reserved' => 'RS',
        'cancelled' => 'CA',
        'refunded' => 'RF',
        'expired' => 'EX',
        'waiting list' => 'WL',
    ];

    /**
     * Snapshot columns that reduce available seat count.
     *
     * @var list<string>
     */
    private const AVAILABILITY_COLUMNS = ['DP', 'FP', 'RS', 'BRS', 'WP'];

    public function execute(int $tourId, string $departureDate, int $companyId): void
    {
        DB::transaction(function () use ($tourId, $departureDate, $companyId) {
            $schedule = TourSchedule::where([
                'tour_id' => $tourId,
                'departure_date' => $departureDate,
                'company_id' => $companyId,
            ])->firstOrFail();

            $availability = TourAvailability::where([
                'company_id' => $companyId,
                'tour_id' => $tourId,
                'schedule_id' => $schedule->id,
            ])->lockForUpdate()->firstOrFail();

            $totals = Booking::query()
                ->select('status', DB::raw('COALESCE(SUM(pax_adult + pax_child), 0) as total_pax'))
                ->where('tour_id', $tourId)
                ->where('departure_date', $departureDate)
                ->groupBy('status')
                ->get()
                ->keyBy('status');

            $snapshotValues = array_fill_keys(array_unique(array_values(self::STATUS_COLUMN_MAP)), 0);
            foreach (self::STATUS_COLUMN_MAP as $statusValue => $columnKey) {
                $row = $totals->get($statusValue);
                $snapshotValues[$columnKey] += $row ? (int) $row->total_pax : 0;
            }

            foreach ($totals->keys() as $statusValue) {
                if ($statusValue !== 'awaiting payment' && ! isset(self::STATUS_COLUMN_MAP[$statusValue])) {
                    logger()->warning('SyncAvailabilityAction: unrecognized booking status encountered', [
                        'status' => $statusValue,
                        'tour_id' => $tourId,
                        'departure_date' => $departureDate,
                        'company_id' => $companyId,
                    ]);
                }
            }

            $snapshotValues['WP'] = (int) Booking::query()
                ->where('tour_id', $tourId)
                ->where('departure_date', $departureDate)
                ->where('status', 'awaiting payment')
                ->whereHas('payments', function ($query): void {
                    $query->whereIn('status', ['pending', 'paid']);
                })
                ->selectRaw('COALESCE(SUM(pax_adult + pax_child), 0) as total_pax')
                ->value('total_pax');

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
