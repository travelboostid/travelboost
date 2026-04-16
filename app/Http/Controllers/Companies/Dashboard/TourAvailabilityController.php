<?php

namespace App\Http\Controllers\Companies\Dashboard;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TourAvailabilityController
{
    public function store(Request $request)
    {
        $rows = $request->input('availabilities', []);

        DB::beginTransaction();

        try {
            foreach ($rows as $row) {
                DB::table('tour_availabilities')->updateOrInsert(
                    [
                        'company_id' => $row['company_id'],
                        'tour_id' => $row['tour_id'],
                        'schedule_id' => $row['schedule_id'],
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

            return back()->withErrors('Failed to save availability');
        }
    }
}
