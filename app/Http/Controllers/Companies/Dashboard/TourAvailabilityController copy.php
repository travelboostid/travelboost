<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Models\Company;
use App\Models\TourSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TourAvailabilityController
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

        DB::beginTransaction();

        try {
            foreach ($rows as $index => $row) {
                $schedule = $currentSchedules->get($index);

                if (! $schedule) {
                    continue;
                }

                DB::table('tour_availabilities')->updateOrInsert(
                    [
                        'company_id' => $company->id,
                        'tour_id' => $tourId,
                        'schedule_id' => $schedule->id,
                    ],
                    [
                        'max_pax' => $row['max_pax'] ?? 0,
                        'WP' => $row['WP'] ?? 0,
                        'DP' => $row['DP'] ?? 0,
                        'FP' => $row['FP'] ?? 0,
                        'RS' => $row['RS'] ?? 0,
                        'CA' => $row['CA'] ?? 0,
                        'RF' => $row['RF'] ?? 0,
                        'EX' => $row['EX'] ?? 0,
                        'WL' => $row['WL'] ?? 0,
                        'available' => $row['available'] ?? 0,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }

            DB::commit();

            return back()->with('success', 'Availability saved');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TourAvailability save failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->withErrors('Failed to save availability: '.$e->getMessage());
        }
    }
}
