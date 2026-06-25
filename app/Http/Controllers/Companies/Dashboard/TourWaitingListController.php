<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\WaitingList\CreateTourWaitingListAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourWaitingListRequest;
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
                && CompanyPermissionMap::userHasScopedPermission($request->user(), $company, 'booking.query'),
            403,
        );

        abort_unless(
            (int) $tour->company_id === (int) $company->id
                || $tour->agentTours()->where('company_id', $company->id)->exists(),
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
