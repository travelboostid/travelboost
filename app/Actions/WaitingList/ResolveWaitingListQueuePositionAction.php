<?php

namespace App\Actions\WaitingList;

use App\Enums\TourWaitingListScheduleStatus;
use App\Models\TourWaitingListSchedule;
use App\Support\WaitingListQueueOrdering;

class ResolveWaitingListQueuePositionAction
{
    public function execute(TourWaitingListSchedule $schedule): ?int
    {
        if ($schedule->status !== TourWaitingListScheduleStatus::QUEUED) {
            return null;
        }

        $orderedIds = WaitingListQueueOrdering::queuedCandidatesForSchedule((int) $schedule->tour_schedule_id)
            ->pluck('tour_waiting_list_schedules.id');

        $index = $orderedIds->search($schedule->id);

        return $index === false ? null : $index + 1;
    }
}
