<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourSchedule;
use App\Models\TourPrice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TourScheduleController extends Controller
{
    public function store(Request $request, Company $company, Tour $tour)
    {
        $data = $request->validate([
            'schedules' => ['required', 'array'],
            'schedules.*.id' => ['nullable', 'integer'],
            'schedules.*.departure_date' => ['required', 'date'],
            'schedules.*.return_date' => ['nullable', 'date'],
            'schedules.*.prices' => ['array'],
        ]);

        DB::beginTransaction();

        try {
            $existingScheduleIds = $tour->schedules()->pluck('id')->toArray();

            $incomingScheduleIds = collect($data['schedules'])
                ->pluck('id')
                ->filter()
                ->toArray();

            // DELETE schedule
            if (count($data['schedules']) > 0 && count($incomingScheduleIds) > 0) {
              $deleteIds = array_diff($existingScheduleIds, $incomingScheduleIds);
              if (!empty($deleteIds)) {
                  TourSchedule::whereIn('id', $deleteIds)->delete();
              }
            }

            foreach ($data['schedules'] as $schedule) {

                $isNewSchedule = empty($schedule['id']);
                
                $scheduleModel = TourSchedule::updateOrCreate(
                    [
                      'id' => $schedule['id'] ?? null,
                      'tour_id' => $tour->id,
                    ],
                    [
                        'tour_id'        => $tour->id,
                        'company_id'     => $company->id,
                        'tour_code'      => $tour->code,
                        'departure_date' => $schedule['departure_date'],
                        'return_date'    => $schedule['return_date'] ?? null,
                    ]
                );

                // ================= PRICE =================
                $existingPriceIds = $scheduleModel->prices()->pluck('id')->toArray();

                $incomingPriceIds = collect($schedule['prices'] ?? [])
                    ->pluck('id')
                    ->filter()
                    ->toArray();

                if (!$isNewSchedule && !empty($incomingPriceIds)) {
                  $deletePriceIds = array_diff($existingPriceIds, $incomingPriceIds);
                  if (!empty($deletePriceIds)) {
                      TourPrice::whereIn('id', $deletePriceIds)->delete();
                  }
                }

                foreach ($schedule['prices'] ?? [] as $price) {

                    if (empty($price['room_type_id'])) continue;

                    $promotionRate = 0;
                    $promotionValue = 0;

                    if (($price['promotion']['type'] ?? '') === 'percent') {
                        $promotionRate = (float) ($price['promotion']['value'] ?? 0);
                    } else {
                        $promotionValue = (float) ($price['promotion']['value'] ?? 0);
                    }

                    $commissionRate = 0;
                    $commissionValue = 0;

                    if (($price['commission']['type'] ?? '') === 'percent') {
                        $commissionRate = (float) ($price['commission']['value'] ?? 0);
                    } else {
                        $commissionValue = (float) ($price['commission']['value'] ?? 0);
                    }

                    TourPrice::updateOrCreate(
                        [
                          'id' => $price['id'] ?? null,
                          'schedule_id' => $scheduleModel->id,
                        ],
                        [
                            'schedule_id'       => $scheduleModel->id,
                            'company_id'        => $company->id,
                            'tour_code'         => $tour->code,
                            'price_category_id' => $price['room_type_id'],
                            'price'             => (int) ($price['price'] ?? 0),
                            'currency'          => $tour->currency,
                            'promotion_rate'    => $promotionRate,
                            'promotion'         => $promotionValue,
                            'commission_rate'   => $commissionRate,
                            'commission'        => $commissionValue,
                        ]
                    );
                }
            }

            DB::commit();

            return back()->with('success', 'Schedules saved');

        } catch (\Throwable $e) {
            DB::rollBack();

            return back()->withErrors([
                'error' => $e->getMessage()
            ]);
        }
    }

    public function destroy(Company $company, Tour $tour, TourSchedule $schedule)
    {
        // pastikan schedule milik tour ini
        if ($schedule->tour_id !== $tour->id) {
            abort(404);
        }

        $schedule->delete();

        return back()->with([
            'success' => true
        ]);
    }
}
