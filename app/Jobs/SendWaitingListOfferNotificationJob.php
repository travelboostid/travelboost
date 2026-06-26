<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Models\TourWaitingListSchedule;
use App\Models\User;
use App\Notifications\WaitingListSeatAvailableNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Throwable;

class SendWaitingListOfferNotificationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public TourWaitingListSchedule $schedule,
        public Booking $booking,
    ) {}

    public function handle(): void
    {
        $schedule = $this->schedule->fresh(['waitingList']);
        $booking = $this->booking->fresh();
        $customerUserId = $schedule?->waitingList?->customer_user_id;

        if (! $schedule || ! $booking || ! $customerUserId) {
            return;
        }

        $customer = User::query()->find($customerUserId);

        if (! $customer) {
            return;
        }

        $offerExpiresAt = $schedule->offer_expires_at
            ?? $booking->reserved_expires_at
            ?? now()->addHours((int) config('waiting-list.offer_hours', 24));

        try {
            Notification::send(
                $customer,
                new WaitingListSeatAvailableNotification($schedule, $booking, $offerExpiresAt),
            );
        } catch (Throwable $exception) {
            Log::error('Waiting list offer notification failed to send.', [
                'waiting_list_schedule_id' => $schedule->id,
                'booking_id' => $booking->id,
                'customer_user_id' => $customer->id,
                'exception' => $exception->getMessage(),
            ]);
        }
    }
}
