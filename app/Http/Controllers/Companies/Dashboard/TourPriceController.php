<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourPrice;

class TourPriceController extends Controller
{
    public function destroy(
        Company $company,
        Tour $tour,
        TourPrice $price
    ) {
        // pastikan price milik company ini
        if ($price->company_id !== $company->id) {
            abort(404);
        }

        // pastikan price milik tour ini
        if (
            ! $price->schedule ||
            $price->schedule->tour_id !== $tour->id
        ) {
            abort(404);
        }

        $price->delete();

        return back()->with([
            'success' => true,
        ]);
    }
}
