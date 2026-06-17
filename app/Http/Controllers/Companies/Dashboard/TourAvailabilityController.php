<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\TourSchedule;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TourAvailabilityController extends Controller
{
    public function store(Request $request, Company $company)
    {
        $rows = $request->input('availabilities', []);

        if (empty($rows)) {
            return back()->withErrors('No availability data provided.');
        }

        $tourId = $rows[0]['tour_id'] ?? null;

        if (! $tourId) {
            return back()->withErrors('Tour ID is missing.');
        }

        $currentSchedules = TourSchedule::where('tour_id', $tourId)
            ->where('company_id', $company->id)
            ->orderBy('departure_date')
            ->get();

        if ($currentSchedules->isEmpty()) {
            return back()->withErrors('No schedules found for this tour.');
        }

        app(ExpireBookingReservationsAction::class)->execute($company, (int) $tourId);

        DB::beginTransaction();
        $availabilitySyncDates = [];
        $immediateManualReservedRows = [];

        try {
            foreach ($rows as $row) {
                if (empty($row['schedule_id'])) {
                    continue;
                }

                $schedule = TourSchedule::where('id', $row['schedule_id'])
                    ->where('company_id', $company->id)
                    ->first();

                if (! $schedule) {
                    continue;
                }

                $existingAvailability = DB::table('tour_availabilities')
                    ->where('company_id', $company->id)
                    ->where('tour_id', $schedule->tour_id)
                    ->where('schedule_id', $schedule->id)
                    ->first();

                $manualReservedValue = max(0, (int) ($row['RS'] ?? 0));
                $manualReservedStartedAt = null;
                $manualReservedExpiresAt = null;
                $manualReservedPendingValue = null;
                $manualReservedOriginalAvailable = null;
                $available = $this->resolveExistingAvailable($existingAvailability, $row);

                if ($manualReservedValue > 0) {
                    $manualReservedStartedAt = $this->resolveManualReservedStartAt($row, $schedule) ?? now('UTC');
                    $manualReservedLimitMinutes = $this->resolveManualReservedLimitMinutes((int) $schedule->tour_id);
                    $manualReservedExpiresAt = $manualReservedLimitMinutes !== null
                        ? $manualReservedStartedAt->copy()->addMinutes($manualReservedLimitMinutes)
                        : null;

                    if ($manualReservedStartedAt->isFuture()) {
                        $manualReservedPendingValue = $manualReservedValue;
                        $available = $this->resolveAvailableWithoutManualReserved(
                            $existingAvailability,
                            $row,
                        );
                        $manualReservedValue = 0;
                    } else {
                        $manualReservedOriginalAvailable = $this->resolveAvailableWithoutManualReserved(
                            $existingAvailability,
                            $row,
                        );
                        $available = max(0, $manualReservedOriginalAvailable - $manualReservedValue);
                    }
                } else {
                    $available = $this->resolveAvailableWithoutManualReserved($existingAvailability, $row);
                }

                DB::table('tour_availabilities')->updateOrInsert(
                    [
                        'company_id' => $company->id,
                        'tour_id' => $schedule->tour_id,
                        'schedule_id' => $schedule->id,
                    ],
                    [
                        'max_pax' => $row['max_pax'] ?? 0,
                        'RS' => $manualReservedValue,
                        'manual_reserved_pending_value' => $manualReservedPendingValue,
                        'BRS' => $row['BRS'] ?? 0,
                        'CA' => $row['CA'] ?? 0,
                        'RF' => $row['RF'] ?? 0,
                        'EX' => $row['EX'] ?? 0,
                        'WL' => $row['WL'] ?? 0,
                        'WP' => $row['WP'] ?? 0,
                        'WPA' => $row['WPA'] ?? 0,
                        'DP' => $row['DP'] ?? 0,
                        'FP' => $row['FP'] ?? 0,
                        'available' => $available,
                        'manual_reserved_started_at' => $manualReservedStartedAt,
                        'manual_reserved_expires_at' => $manualReservedExpiresAt,
                        'manual_reserved_original_available' => $manualReservedOriginalAvailable,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                if ($manualReservedValue > 0 && $manualReservedPendingValue === null) {
                    $immediateManualReservedRows[] = [
                        'company_id' => $company->id,
                        'tour_id' => (int) $schedule->tour_id,
                        'schedule_id' => (int) $schedule->id,
                        'RS' => $manualReservedValue,
                    ];
                }

                $availabilitySyncDates[] = (string) $schedule->departure_date;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        foreach (array_unique($availabilitySyncDates) as $departureDate) {
            app(SyncAvailabilityAction::class)->execute((int) $tourId, $departureDate, $company->id);
        }

        foreach ($immediateManualReservedRows as $manualReservedRow) {
            $this->reapplyManualReservedAfterSync($manualReservedRow);
        }

        return back()->with('success', 'Availability saved');
    }

    /**
     * @param  array{company_id: int, tour_id: int, schedule_id: int, RS: int}  $manualReservedRow
     */
    private function reapplyManualReservedAfterSync(array $manualReservedRow): void
    {
        DB::transaction(function () use ($manualReservedRow): void {
            $availability = DB::table('tour_availabilities')
                ->where('company_id', $manualReservedRow['company_id'])
                ->where('tour_id', $manualReservedRow['tour_id'])
                ->where('schedule_id', $manualReservedRow['schedule_id'])
                ->lockForUpdate()
                ->first();

            if (! $availability) {
                return;
            }

            $reservedSeats = max(0, (int) $manualReservedRow['RS']);
            $available = max(
                0,
                (int) $availability->max_pax
                - $reservedSeats
                - (int) $availability->BRS
                - (int) $availability->DP
                - (int) $availability->FP
                - (int) $availability->WPA,
            );

            DB::table('tour_availabilities')
                ->where('id', $availability->id)
                ->update([
                    'RS' => $reservedSeats,
                    'available' => $available,
                    'updated_at' => now(),
                ]);
        });
    }

    private function resolveManualReservedStartAt(array $row, TourSchedule $schedule): ?CarbonInterface
    {
        $hasExplicitDate = filled($row['manual_reserved_start_date'] ?? null);
        $hasExplicitTime = filled($row['manual_reserved_start_time'] ?? null);

        if (! $hasExplicitDate && ! $hasExplicitTime) {
            return now('UTC');
        }

        $date = $row['manual_reserved_start_date'] ?? $schedule->departure_date;
        $timezone = $this->resolveManualReservedTimezone($row);
        $time = $row['manual_reserved_start_time'] ?? now($timezone)->format('H:i');

        if (! $date) {
            return null;
        }

        try {
            return Carbon::parse($date.' '.$time, $timezone)->utc();
        } catch (\Throwable) {
            return null;
        }
    }

    private function resolveManualReservedTimezone(array $row): string
    {
        $fallbackTimezone = (string) (config('travelboost.scheduler_timezone') ?? config('app.timezone', 'UTC'));
        $timezone = is_string($row['manual_reserved_timezone'] ?? null)
            ? trim($row['manual_reserved_timezone'])
            : '';

        if ($timezone === '') {
            return $fallbackTimezone;
        }

        try {
            return Carbon::now($timezone)->timezoneName;
        } catch (\Throwable) {
            return $fallbackTimezone;
        }
    }

    private function resolveExistingAvailable(?object $existingAvailability, array $row): int
    {
        if ($existingAvailability) {
            return (int) $existingAvailability->available;
        }

        return $this->resolveAvailableWithoutManualReserved(null, $row);
    }

    private function resolveAvailableWithoutManualReserved(?object $existingAvailability, array $row): int
    {
        if ($existingAvailability) {
            $currentReservedSeats = (int) ($existingAvailability->RS ?? 0);
            $currentAvailable = (int) ($existingAvailability->available ?? 0);

            return max(
                0,
                (int) ($existingAvailability->manual_reserved_original_available ?? ($currentAvailable + $currentReservedSeats)),
            );
        }

        $maxPax = max(0, (int) ($row['max_pax'] ?? 0));
        $reducingColumns = [
            max(0, (int) ($row['DP'] ?? 0)),
            max(0, (int) ($row['FP'] ?? 0)),
            max(0, (int) ($row['BRS'] ?? 0)),
            max(0, (int) ($row['WPA'] ?? 0)),
        ];

        return max(0, $maxPax - array_sum($reducingColumns));
    }

    private function resolveManualReservedLimitMinutes(int $tourId): ?int
    {
        $tour = DB::table('tours')->where('id', $tourId)->first(['category_id']);

        if (! $tour?->category_id) {
            return null;
        }

        $category = DB::table('tour_categories')->where('id', $tour->category_id)->first([
            'manual_reserved_limit_value',
            'manual_reserved_limit_unit',
        ]);

        $value = $category?->manual_reserved_limit_value;
        $unit = $category?->manual_reserved_limit_unit;

        if ($value === null || $unit === null) {
            return null;
        }

        $resolvedValue = max(1, (int) $value);

        return $unit === 'minute' ? $resolvedValue : $resolvedValue * 60;
    }
}
