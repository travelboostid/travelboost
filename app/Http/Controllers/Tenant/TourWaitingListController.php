<?php

namespace App\Http\Controllers\Tenant;

use App\Actions\WaitingList\CreateTourWaitingListAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourWaitingListRequest;
use App\Models\Company;
use App\Models\Tour;
use Illuminate\Http\RedirectResponse;

class TourWaitingListController extends Controller
{
    public function store(
        StoreTourWaitingListRequest $request,
        string $username,
        Tour $tour,
        CreateTourWaitingListAction $createTourWaitingList,
    ): RedirectResponse {
        $tenant = $request->attributes->get('tenant');
        abort_unless($tenant instanceof Company && $tenant->username === $username, 404);

        $createTourWaitingList->execute(
            creator: $request->user(),
            tour: $tour,
            data: $request->validated(),
            tenantAgent: $tenant,
        );

        return back()->with('success', 'Waiting-list request submitted successfully.');
    }
}
