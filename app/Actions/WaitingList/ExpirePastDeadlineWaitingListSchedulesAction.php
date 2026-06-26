<?php

namespace App\Actions\WaitingList;

use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\TourWaitingListSchedule;
use App\Support\WaitingListBookingDeadline;
use Illuminate\Support\Facades\DB;

class ExpirePastDeadlineWaitingListSchedulesAction
{
    public function __construct(
        private ExpireWaitingListOffersAction $expireWaitingListOffers,
    ) {}

    public function execute(): int
    {
        $expiredCount = 0;

        $scheduleIds = TourWaitingListSchedule::query()
            ->whereIn('status', TourWaitingListScheduleStatus::activeQueueValues())
            ->with([
                'tourSchedule:id,departure_date,tour_id',
                'waitingList.tour.company.companySetting',
            ])
            ->get()
            ->filter(function (TourWaitingListSchedule $schedule): bool {
                $tourSchedule = $schedule->tourSchedule;
                $tour = $schedule->waitingList?->tour;

                if (! $tourSchedule || ! $tour) {
                    return false;
                }

                return WaitingListBookingDeadline::isPastDeadline($tourSchedule, $tour);
            })
            ->pluck('id');

        foreach ($scheduleIds as $scheduleId) {
            if ($this->expireSchedule((int) $scheduleId)) {
                $expiredCount++;
            }
        }

        return $expiredCount;
    }

    public function expireSchedule(int $scheduleId): bool
    {
        $schedule = TourWaitingListSchedule::query()
            ->with([
                'tourSchedule:id,departure_date,tour_id',
                'waitingList.tour.company.companySetting',
            ])
            ->find($scheduleId);

        if (! $schedule) {
            return false;
        }

        $tourSchedule = $schedule->tourSchedule;
        $tour = $schedule->waitingList?->tour;

        if (! $tourSchedule || ! $tour) {
            return false;
        }

        if (! WaitingListBookingDeadline::isPastDeadline($tourSchedule, $tour)) {
            return false;
        }

        if ($schedule->status === TourWaitingListScheduleStatus::OFFERED) {
            return $this->expireWaitingListOffers->expireScheduleOffer($scheduleId, force: true);
        }

        if ($schedule->status !== TourWaitingListScheduleStatus::QUEUED) {
            return false;
        }

        return DB::transaction(function () use ($scheduleId): bool {
            $schedule = TourWaitingListSchedule::query()
                ->whereKey($scheduleId)
                ->where('status', TourWaitingListScheduleStatus::QUEUED)
                ->lockForUpdate()
                ->first();

            if (! $schedule) {
                return false;
            }

            $schedule->update([
                'status' => TourWaitingListScheduleStatus::EXPIRED,
            ]);

            $waitingList = $schedule->waitingList()->lockForUpdate()->first();

            if ($waitingList && ! $waitingList->schedules()
                ->whereIn('status', TourWaitingListScheduleStatus::activeQueueValues())
                ->exists()) {
                $waitingList->update([
                    'status' => TourWaitingListStatus::EXPIRED,
                ]);
            }

            return true;
        });
    }
}
