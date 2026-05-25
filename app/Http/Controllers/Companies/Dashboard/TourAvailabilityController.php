<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\TourSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

                DB::table('tour_availabilities')->updateOrInsert(
                    [
                        'company_id' => $company->id,
                        'tour_id' => $schedule->tour_id,
                        'schedule_id' => $schedule->id,
                    ],
                    [
                        'max_pax' => $row['max_pax'] ?? 0,
                        'RS' => $row['RS'] ?? 0,
                        'BRS' => $row['BRS'] ?? 0,
                        'CA' => $row['CA'] ?? 0,
                        'RF' => $row['RF'] ?? 0,
                        'EX' => $row['EX'] ?? 0,
                        'WL' => $row['WL'] ?? 0,
                        'WP' => $row['WP'] ?? 0,
                        'WPA' => $row['WPA'] ?? 0,
                        'DP' => $row['DP'] ?? 0,
                        'FP' => $row['FP'] ?? 0,
                        'available' => $row['available'] ?? 0,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                $availabilitySyncDates[] = (string) $schedule->departure_date;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TourAvailability save failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->withErrors('Failed to save availability: '.$e->getMessage());
        }

        foreach (array_unique($availabilitySyncDates) as $departureDate) {
            app(SyncAvailabilityAction::class)->execute((int) $tourId, $departureDate, $company->id);
        }

        return back()->with('success', 'Availability saved');
    }
}
