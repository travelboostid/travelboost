<?php

namespace App\Actions\WaitingList;

use App\Enums\BookingStatus;
use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\Booking;
use App\Models\TourWaitingListSchedule;
use Illuminate\Support\Facades\DB;

class FulfillTourWaitingListFromBookingAction
{
    public function execute(Booking $booking): void
    {
        if (! in_array($booking->status, [
            BookingStatus::DOWN_PAYMENT,
            BookingStatus::FULL_PAYMENT,
            BookingStatus::WAITING_PAYMENT_APPROVAL,
        ], true)) {
            return;
        }

        $scheduleId = TourWaitingListSchedule::query()
            ->where('booking_id', $booking->id)
            ->where('status', TourWaitingListScheduleStatus::OFFERED)
            ->value('id');

        if (! $scheduleId) {
            return;
        }

        DB::transaction(function () use ($scheduleId, $booking): void {
            $schedule = TourWaitingListSchedule::query()
                ->whereKey($scheduleId)
                ->where('status', TourWaitingListScheduleStatus::OFFERED)
                ->lockForUpdate()
                ->first();

            if (! $schedule) {
                return;
            }

            $schedule->update([
                'status' => TourWaitingListScheduleStatus::FULFILLED,
            ]);

            $waitingList = $schedule->waitingList()->lockForUpdate()->first();

            if (! $waitingList) {
                return;
            }

            $waitingList->update([
                'status' => TourWaitingListStatus::FULFILLED,
                'booking_id' => $booking->id,
                'fulfilled_at' => now(),
            ]);
        });
    }
}
