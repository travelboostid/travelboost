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

        return $this->mapForSchedule((int) $schedule->tour_schedule_id)[$schedule->id] ?? null;
    }

    /**
     * @return array<int, int> entry id => 1-based queue position
     */
    public function mapForSchedule(int $tourScheduleId): array
    {
        $orderedIds = WaitingListQueueOrdering::queuedCandidatesForSchedule($tourScheduleId)
            ->pluck('tour_waiting_list_schedules.id');

        $positions = [];

        foreach ($orderedIds as $index => $id) {
            $positions[(int) $id] = $index + 1;
        }

        return $positions;
    }

    /**
     * @param  array<int, int>  $tourScheduleIds
     * @return array<int, array<int, int>> tour_schedule_id => [entry id => position]
     */
    public function mapsForScheduleIds(array $tourScheduleIds): array
    {
        $maps = [];

        foreach (array_unique($tourScheduleIds) as $tourScheduleId) {
            $maps[(int) $tourScheduleId] = $this->mapForSchedule((int) $tourScheduleId);
        }

        return $maps;
    }
}
