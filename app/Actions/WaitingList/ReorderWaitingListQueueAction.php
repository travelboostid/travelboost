<?php

namespace App\Actions\WaitingList;

use App\Enums\TourWaitingListScheduleStatus;
use App\Models\TourSchedule;
use App\Models\TourWaitingListSchedule;
use App\Support\WaitingListBookingDeadline;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReorderWaitingListQueueAction
{
    /**
     * @param  list<int>  $orderedScheduleIds
     */
    public function execute(int $tourScheduleId, array $orderedScheduleIds): void
    {
        $tourSchedule = TourSchedule::query()
            ->with('tour.company.companySetting')
            ->findOrFail($tourScheduleId);

        if (WaitingListBookingDeadline::isPastDeadline($tourSchedule, $tourSchedule->tour)) {
            throw ValidationException::withMessages([
                'order' => 'This departure has passed the booking deadline and its queue can no longer be managed.',
            ]);
        }

        DB::transaction(function () use ($tourScheduleId, $orderedScheduleIds): void {
            $queuedIds = TourWaitingListSchedule::query()
                ->where('tour_schedule_id', $tourScheduleId)
                ->where('status', TourWaitingListScheduleStatus::QUEUED)
                ->pluck('id')
                ->map(fn (mixed $id): int => (int) $id)
                ->sort()
                ->values();

            $requestedIds = collect($orderedScheduleIds)
                ->map(fn (mixed $id): int => (int) $id)
                ->unique()
                ->sort()
                ->values();

            if ($queuedIds->count() !== $requestedIds->count() || $queuedIds->diff($requestedIds)->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'order' => 'Queue order must include every queued waiting-list schedule for this departure.',
                ]);
            }

            foreach ($orderedScheduleIds as $position => $scheduleId) {
                TourWaitingListSchedule::query()
                    ->whereKey((int) $scheduleId)
                    ->where('tour_schedule_id', $tourScheduleId)
                    ->where('status', TourWaitingListScheduleStatus::QUEUED)
                    ->update([
                        'manual_queue_position' => $position + 1,
                    ]);
            }
        });
    }
}
