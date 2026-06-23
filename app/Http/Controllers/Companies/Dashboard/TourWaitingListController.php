<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\WaitingList\CreateTourWaitingListAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourWaitingListRequest;
use App\Models\Company;
use App\Models\Tour;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class TourWaitingListController extends Controller
{
    public function store(
        StoreTourWaitingListRequest $request,
        Company $company,
        Tour $tour,
        CreateTourWaitingListAction $createTourWaitingList,
    ): RedirectResponse {
        Gate::authorize('view', $company);

        $createTourWaitingList->execute(
            creator: $request->user(),
            tour: $tour,
            data: $request->validated(),
            creatorCompany: $company,
        );

        return back()->with('success', 'Waiting-list request submitted successfully.');
    }
}
