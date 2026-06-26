<?php

namespace App\Actions\WaitingList;

use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingStatus;
use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\Booking;
use App\Models\TourWaitingListSchedule;
use Illuminate\Support\Facades\DB;

class ExpireWaitingListOffersAction
{
    public function execute(): int
    {
        $expiredCount = 0;

        $scheduleIds = TourWaitingListSchedule::query()
            ->where('status', TourWaitingListScheduleStatus::OFFERED)
            ->whereNotNull('offer_expires_at')
            ->where('offer_expires_at', '<=', now())
            ->pluck('id');

        foreach ($scheduleIds as $scheduleId) {
            if ($this->expireScheduleOffer((int) $scheduleId)) {
                $expiredCount++;
            }
        }

        return $expiredCount;
    }

    public function expireScheduleOffer(int $scheduleId, bool $force = false): bool
    {
        return DB::transaction(function () use ($scheduleId, $force): bool {
            $schedule = TourWaitingListSchedule::query()
                ->whereKey($scheduleId)
                ->where('status', TourWaitingListScheduleStatus::OFFERED)
                ->lockForUpdate()
                ->first();

            if (! $schedule) {
                return false;
            }

            if (
                ! $force
                && $schedule->offer_expires_at
                && $schedule->offer_expires_at->isFuture()
            ) {
                return false;
            }

            if ($schedule->booking_id) {
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
