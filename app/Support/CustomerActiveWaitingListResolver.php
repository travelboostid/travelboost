<?php

namespace App\Support;

use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\TourWaitingListSchedule;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class CustomerActiveWaitingListResolver
{
    /**
     * @return Collection<int, TourWaitingListSchedule>
     */
    public function activeSchedulesForCustomer(User $customer): Collection
    {
        $candidateSchedules = TourWaitingListSchedule::query()
            ->whereIn('status', TourWaitingListScheduleStatus::activeQueueValues())
            ->whereHas('waitingList', fn ($query) => $query
                ->where('customer_user_id', $customer->id)
                ->whereNotIn('status', [
                    TourWaitingListStatus::CANCELLED->value,
                    TourWaitingListStatus::EXPIRED->value,
                    TourWaitingListStatus::FULFILLED->value,
                ]))
            ->with([
                'tourSchedule.tour.company.companySetting',
                'waitingList.tour.company.companySetting',
            ])
            ->get();

        return $candidateSchedules
            ->filter(fn (TourWaitingListSchedule $schedule): bool => $this->isStillInsideBookingDeadline($schedule))
            ->values();
    }

    public function activeScheduleCountForCustomer(User $customer): int
    {
        return $this->activeSchedulesForCustomer($customer)->count();
    }

    public function activePriorityScheduleForCustomer(User $customer): ?TourWaitingListSchedule
    {
        return $this->activeSchedulesForCustomer($customer)
            ->first(fn (TourWaitingListSchedule $schedule): bool => (bool) $schedule->is_priority);
    }

    public function customerHasActiveScheduleSelection(User $customer, Collection $scheduleIds): bool
    {
        return $this->activeSchedulesForCustomer($customer)
            ->contains(fn (TourWaitingListSchedule $schedule): bool => $scheduleIds->contains((int) $schedule->tour_schedule_id));
    }

    public function clearExistingPriority(User $customer): void
    {
        $priorityScheduleIds = $this->activeSchedulesForCustomer($customer)
            ->filter(fn (TourWaitingListSchedule $schedule): bool => (bool) $schedule->is_priority)
            ->pluck('id')
            ->all();

        if ($priorityScheduleIds === []) {
            return;
        }

        TourWaitingListSchedule::query()
            ->whereIn('id', $priorityScheduleIds)
            ->update(['is_priority' => false]);
    }

    private function isStillInsideBookingDeadline(TourWaitingListSchedule $schedule): bool
    {
        $tourSchedule = $schedule->tourSchedule;
        $tour = $schedule->waitingList?->tour ?? $tourSchedule?->tour;

        if (! $tourSchedule || ! $tour) {
            return false;
        }

        $deadlineDays = max(0, (int) ($tour->company?->companySetting?->booking_deadline ?? 0));
        $earliestBookableDeparture = now()->startOfDay()->addDays($deadlineDays);

        return Carbon::parse($tourSchedule->departure_date)
            ->startOfDay()
            ->gte($earliestBookableDeparture);
    }
}
