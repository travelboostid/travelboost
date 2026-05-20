<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Tour;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SeatAvailabilityController extends Controller
{
    public function index(Request $request, Company $company)
    {
        $departureDate = $request->departure_date;
        $status = $request->status ?? 'active';

        $isAgent = DB::table('agent_tours')
            ->where('company_id', $company->id)
            ->exists();

        $allowedTourIds = [];

        if ($isAgent) {
            $allowedTourIds = DB::table('agent_tours')
                ->where('company_id', $company->id)
                ->where('status', 'active')
                ->pluck('tour_id');
        } else {
            $allowedTourIds = Tour::query()
                ->where('company_id', $company->id)
                ->where('status', 'active')
                ->pluck('id');
        }

        $tours = Tour::query()
            ->with([
                'availabilities' => function ($q) use ($departureDate) {

                    $q->with([
                        'schedule:id,tour_id,departure_date,return_date',
                    ]);

                    if ($departureDate) {
                        $q->whereHas('schedule', function ($sq) use ($departureDate) {
                            $sq->whereDate('departure_date', '>=', $departureDate);
                        });
                    }
                },
            ])

            ->whereIn('id', $allowedTourIds)

            ->where('status', 'active')

            ->whereHas('availabilities.schedule')

            ->when($departureDate, function ($q) use ($departureDate) {
                $q->whereHas('availabilities.schedule', function ($sq) use ($departureDate) {
                    $sq->whereDate('departure_date', '>=', $departureDate);
                });
            })

            ->when($status === 'active', function ($q) {
                $q->whereHas('availabilities.schedule', function ($sq) {
                    $sq->whereDate('departure_date', '>', now()->toDateString());
                });
            })

            ->when($status === 'inactive', function ($q) {
                $q->whereHas('availabilities.schedule', function ($sq) {
                    $sq->whereDate('departure_date', '<=', now()->toDateString());
                });
            })

            ->when($request->search, function ($q) use ($request) {
                $q->where(
                    'name',
                    'ilike',
                    '%'.$request->search.'%'
                );
            })

            ->orderBy('name')

            ->paginate(10)

            ->withQueryString();

        $availabilities = $tours->through(function ($tour) {
            return [
                'tour' => [
                    'id' => $tour->id,
                    'name' => $tour->name,
                ],

                'schedules' => $tour->availabilities
                    ->filter(fn ($item) => $item->schedule)
                    ->map(function ($item) {
                        return [
                            'id' => $item->id,

                            'schedule_id' => $item->schedule_id,

                            'departure_date' => $item->schedule?->departure_date,
                            'return_date' => $item->schedule?->return_date,

                            'max_pax' => $item->max_pax,

                            'RS' => $item->RS,
                            'WP' => $item->WP,
                            'DP' => $item->DP,
                            'FP' => $item->FP,
                            'WA' => $item->WA,
                            'WPA' => $item->WPA,
                            'BRS' => $item->BRS,
                            'CA' => $item->CA,
                            'RF' => $item->RF,
                            'EX' => $item->EX,
                            'WL' => $item->WL,

                            'available' => $item->available,
                        ];
                    })->values(),
            ];
        });

        return Inertia::render(
            'companies/dashboard/reports/seat-availabilities/index',
            [
                'availabilities' => $availabilities,

                'filters' => [
                    'search' => $request->search,
                    'departure_date' => $request->departure_date,
                    'status' => $status,
                ],
            ]
        );
    }
}
