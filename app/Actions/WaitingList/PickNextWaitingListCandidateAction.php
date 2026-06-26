<?php

namespace App\Actions\WaitingList;

use App\Models\TourWaitingListSchedule;
use App\Support\WaitingListQueueOrdering;

class PickNextWaitingListCandidateAction
{
    public function execute(int $tourScheduleId, int $availableSeats): ?TourWaitingListSchedule
    {
        if ($availableSeats <= 0) {
            return null;
        }

        $candidates = WaitingListQueueOrdering::queuedCandidatesForSchedule($tourScheduleId)
            ->with('waitingList')
            ->get();

        foreach ($candidates as $candidate) {
            $requiredSeats = (int) $candidate->pax_adult + (int) $candidate->pax_child;

            if ($requiredSeats <= $availableSeats) {
                return $candidate;
            }
        }

        return null;
    }
}
