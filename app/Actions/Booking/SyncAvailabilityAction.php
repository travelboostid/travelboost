<?php

namespace App\Actions\Booking;

use App\Models\Booking;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use Illuminate\Support\Facades\DB;

/**
 * Synchronizes the tour_availabilities snapshot for a given schedule slot.
 *
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
    'down payment' => 'DP',
    'full payment' => 'FP',
    'reserved' => 'RS',
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
  private const AVAILABILITY_COLUMNS = ['DP', 'FP', 'RS'];

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

      $snapshotValues = [];
      foreach (self::STATUS_COLUMN_MAP as $statusValue => $columnKey) {
        $row = $totals->get($statusValue);
        $snapshotValues[$columnKey] = $row ? (int) $row->total_pax : 0;
      }

      foreach ($totals->keys() as $statusValue) {
        if (! isset(self::STATUS_COLUMN_MAP[$statusValue])) {
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
