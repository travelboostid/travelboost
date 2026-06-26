<?php

namespace App\Policies;

use App\Enums\CompanyType;
use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\Company;
use App\Models\TourWaitingList;
use App\Models\TourWaitingListSchedule;
use App\Models\User;

class TourWaitingListPolicy
{
    public function viewAny(User $user, Company $company): bool
    {
        return $this->belongsToCompany($user, $company);
    }

    public function manage(User $user, TourWaitingList $waitingList, Company $company): bool
    {
        return $this->manageQueues($user, $company)
            && (int) $waitingList->vendor_id === (int) $company->id;
    }

    public function manageQueues(User $user, Company $company): bool
    {
        if (! $this->belongsToCompany($user, $company)) {
            return false;
        }

        $companyType = strtolower($company->type->value ?? $company->type);

        return $companyType === CompanyType::VENDOR->value;
    }

    public function viewWaitingList(User $user, TourWaitingList $waitingList, Company $company): bool
    {
        if (! $this->belongsToCompany($user, $company)) {
            return false;
        }

        $companyType = strtolower($company->type->value ?? $company->type);

        if ($companyType === CompanyType::VENDOR->value) {
            return (int) $waitingList->vendor_id === (int) $company->id;
        }

        if ($companyType === CompanyType::AGENT->value) {
            return (int) $waitingList->created_by_company_id === (int) $company->id
                || (int) $waitingList->agent_company_id === (int) $company->id
                || $waitingList->customerUser?->company_id === $company->id;
        }

        return false;
    }

    public function manageSchedule(User $user, TourWaitingListSchedule $schedule, Company $company): bool
    {
        if (! $this->manageQueues($user, $company)) {
            return false;
        }

        $waitingList = $schedule->waitingList;

        return $waitingList && (int) $waitingList->vendor_id === (int) $company->id;
    }

    public function updateAsCustomer(User $user, TourWaitingList $waitingList): bool
    {
        return $this->customerCanManageQueuedRequest($user, $waitingList);
    }

    public function cancelAsCustomer(User $user, TourWaitingList $waitingList): bool
    {
        return $this->customerCanManageQueuedRequest($user, $waitingList);
    }

    private function customerCanManageQueuedRequest(User $user, TourWaitingList $waitingList): bool
    {
        if ((int) $waitingList->customer_user_id !== (int) $user->id) {
            return false;
        }

        if (! in_array($waitingList->status, [
            TourWaitingListStatus::PENDING,
            TourWaitingListStatus::CONTACTED,
        ], true)) {
            return false;
        }

        $schedules = $waitingList->relationLoaded('schedules')
            ? $waitingList->schedules
            : $waitingList->schedules()->get();

        $hasQueued = $schedules->contains(
            fn (TourWaitingListSchedule $schedule): bool => $schedule->status === TourWaitingListScheduleStatus::QUEUED,
        );

        $hasOffered = $schedules->contains(
            fn (TourWaitingListSchedule $schedule): bool => $schedule->status === TourWaitingListScheduleStatus::OFFERED,
        );

        return $hasQueued && ! $hasOffered;
    }

    private function belongsToCompany(User $user, Company $company): bool
    {
        if ($user->hasRole('user:admin')) {
            return true;
        }

        return $user->hasRole("company:{$company->id}:superadmin")
            || $user->hasRole("company:{$company->id}:admin")
            || $user->isAbleTo('tour.query', "company:{$company->id}");
    }
}
