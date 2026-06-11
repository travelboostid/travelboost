<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Companies\Dashboard\TourScheduleController;
use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Models\TourSchedule;
use Illuminate\Http\Request;

class AdminTourScheduleController extends Controller
{
    public function store(Request $request, Tour $tour)
    {
        abort_unless($tour->company, 404);

        return app(TourScheduleController::class)->store($request, $tour->company, $tour);
    }

    public function destroy(Tour $tour, TourSchedule $schedule)
    {
        abort_unless($tour->company, 404);

        return app(TourScheduleController::class)->destroy($tour->company, $tour, $schedule);
    }
}
