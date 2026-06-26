<?php

namespace App\Support;

use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\TourWaitingListSchedule;
use Illuminate\Database\Eloquent\Builder;

class WaitingListQueueOrdering
{
    /**
     * @return Builder<TourWaitingListSchedule>
     */
    public static function queuedCandidatesForSchedule(int $tourScheduleId): Builder
    {
        return TourWaitingListSchedule::query()
            ->where('tour_waiting_list_schedules.tour_schedule_id', $tourScheduleId)
            ->where('tour_waiting_list_schedules.status', TourWaitingListScheduleStatus::QUEUED)
            ->whereHas('waitingList', function (Builder $query): void {
                $query->whereNotIn('status', [
                    TourWaitingListStatus::CANCELLED->value,
                    TourWaitingListStatus::FULFILLED->value,
                    TourWaitingListStatus::EXPIRED->value,
                ]);
            })
            ->join(
                'tour_waiting_lists',
                'tour_waiting_list_schedules.tour_waiting_list_id',
                '=',
                'tour_waiting_lists.id'
            )
            ->select('tour_waiting_list_schedules.*')
            ->orderByRaw('tour_waiting_list_schedules.manual_queue_position ASC NULLS LAST')
            ->orderBy('tour_waiting_lists.created_at');
    }
}
