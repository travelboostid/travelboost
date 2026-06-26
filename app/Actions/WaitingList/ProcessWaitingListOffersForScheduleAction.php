<?php

namespace App\Actions\WaitingList;

use App\Models\TourAvailability;
use App\Models\TourWaitingListSchedule;
use App\Support\WaitingListQueueOrdering;

class ProcessWaitingListOffersForScheduleAction
{
    public function execute(int $tourScheduleId): ?TourWaitingListSchedule
    {
        $candidates = WaitingListQueueOrdering::queuedCandidatesForSchedule($tourScheduleId)
            ->with('waitingList')
            ->get();

        foreach ($candidates as $candidate) {
            $waitingList = $candidate->waitingList;

            if (! $waitingList) {
                continue;
            }

            $availability = TourAvailability::query()
                ->where('company_id', $waitingList->vendor_id)
                ->where('tour_id', $waitingList->tour_id)
                ->where('schedule_id', $tourScheduleId)
                ->first();

            if (! $availability) {
                continue;
            }

            $availableSeats = (int) $availability->available;
            $requiredSeats = (int) $candidate->pax_adult + (int) $candidate->pax_child;

            if ($requiredSeats <= 0 || $requiredSeats > $availableSeats) {
                continue;
            }

            return app(OfferWaitingListSeatAction::class)->execute($candidate);
        }

        return null;
    }
}
