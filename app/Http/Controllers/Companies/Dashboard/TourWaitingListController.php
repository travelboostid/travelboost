<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\WaitingList\CreateTourWaitingListAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourWaitingListRequest;
use App\Models\AgentTour;
use App\Models\Company;
use App\Models\Tour;
use App\Support\CompanyPermissionMap;
use Illuminate\Http\RedirectResponse;

class TourWaitingListController extends Controller
{
    public function store(
        StoreTourWaitingListRequest $request,
        Company $company,
        Tour $tour,
        CreateTourWaitingListAction $createTourWaitingList,
    ): RedirectResponse {
        abort_unless(
            $request->user()
                && CompanyPermissionMap::userHasScopedPermission($request->user(), $company, 'booking.mutation'),
            403,
        );

        abort_unless(
            (int) $tour->company_id === (int) $company->id
                || AgentTour::query()
                    ->where('company_id', $company->id)
                    ->where('tour_id', $tour->id)
                    ->where('status', 'active')
                    ->exists(),
            404,
        );

        $createTourWaitingList->execute(
            creator: $request->user(),
            tour: $tour,
            data: $request->validated(),
            creatorCompany: $company,
        );

        return back()->with('success', 'Waiting-list request submitted successfully.');
    }
}
