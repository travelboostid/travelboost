<?php

namespace App\Http\Controllers\Me;

use App\Actions\WaitingList\UpdateCustomerTourWaitingListAction;
use App\Actions\WaitingList\UpdateTourWaitingListStatusAction;
use App\Enums\TourWaitingListStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateCustomerTourWaitingListRequest;
use App\Models\TourWaitingList;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CustomerWaitingListController extends Controller
{
    public function update(
        UpdateCustomerTourWaitingListRequest $request,
        string $username,
        TourWaitingList $waitingList,
        UpdateCustomerTourWaitingListAction $updateCustomerWaitingList,
    ): RedirectResponse {
        $this->authorize('updateAsCustomer', $waitingList);

        $updateCustomerWaitingList->execute(
            customer: $request->user(),
            waitingList: $waitingList,
            data: $request->validated(),
        );

        return back()->with('success', 'Waiting list request updated.');
    }

    public function cancel(
        Request $request,
        string $username,
        TourWaitingList $waitingList,
        UpdateTourWaitingListStatusAction $updateStatus,
    ): RedirectResponse {
        $this->authorize('cancelAsCustomer', $waitingList);

        $updateStatus->execute($waitingList, TourWaitingListStatus::CANCELLED);

        return back()->with('success', 'Waiting list request cancelled.');
    }
}
