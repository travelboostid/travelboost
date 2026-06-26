<?php

namespace App\Actions\WaitingList;

use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingStatus;
use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\Booking;
use App\Models\TourWaitingList;
use App\Models\TourWaitingListSchedule;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateTourWaitingListStatusAction
{
    public function execute(
        TourWaitingList $waitingList,
        TourWaitingListStatus $status,
        ?string $statusNote = null,
    ): TourWaitingList {
        return DB::transaction(function () use ($waitingList, $status, $statusNote): TourWaitingList {
            $waitingList = TourWaitingList::query()
                ->whereKey($waitingList->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($waitingList->status === TourWaitingListStatus::FULFILLED) {
                throw ValidationException::withMessages([
                    'status' => 'Fulfilled waiting-list requests cannot be updated.',
                ]);
            }

            if ($status === TourWaitingListStatus::CONTACTED) {
                if ($waitingList->status !== TourWaitingListStatus::PENDING) {
                    throw ValidationException::withMessages([
                        'status' => 'Only pending waiting-list requests can be marked as contacted.',
                    ]);
                }

                $waitingList->update([
                    'status' => TourWaitingListStatus::CONTACTED,
                    'status_note' => $statusNote,
                ]);

                return $waitingList->fresh();
            }

            if ($status === TourWaitingListStatus::CANCELLED) {
                if (in_array($waitingList->status, [
                    TourWaitingListStatus::CANCELLED,
                    TourWaitingListStatus::EXPIRED,
                    TourWaitingListStatus::FULFILLED,
                ], true)) {
                    throw ValidationException::withMessages([
                        'status' => 'This waiting-list request is already closed.',
                    ]);
                }

                $waitingList->schedules()
                    ->lockForUpdate()
                    ->get()
                    ->each(function (TourWaitingListSchedule $schedule): void {
                        if ($schedule->status === TourWaitingListScheduleStatus::OFFERED) {
                            $this->releaseOfferBooking($schedule);
                        }

                        if (in_array($schedule->status, [
                            TourWaitingListScheduleStatus::QUEUED,
                            TourWaitingListScheduleStatus::OFFERED,
                        ], true)) {
                            $schedule->update([
                                'status' => TourWaitingListScheduleStatus::CANCELLED,
                            ]);
                        }
                    });

                $waitingList->update([
                    'status' => TourWaitingListStatus::CANCELLED,
                    'cancelled_at' => now(),
                    'status_note' => $statusNote,
                ]);

                return $waitingList->fresh();
            }

            throw ValidationException::withMessages([
                'status' => 'Unsupported waiting-list status update.',
            ]);
        });
    }

    private function releaseOfferBooking(TourWaitingListSchedule $schedule): void
    {
        if (! $schedule->booking_id) {
            return;
        }

        $booking = Booking::query()
            ->whereKey($schedule->booking_id)
            ->lockForUpdate()
            ->first();

        if (
            $booking
            && $booking->status === BookingStatus::BOOKING_RESERVED
            && $booking->reserved_type === 'waiting_list_offer'
        ) {
            $booking->update([
                'status' => BookingStatus::EXPIRED,
                'reserved_expires_at' => null,
            ]);

            app(SyncAvailabilityAction::class)
                ->executeForBooking($booking->fresh());
        }
    }
}
