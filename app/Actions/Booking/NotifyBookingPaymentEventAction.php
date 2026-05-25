<?php

namespace App\Actions\Booking;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\BookingPaymentNotification;
use Illuminate\Support\Facades\DB;

class NotifyBookingPaymentEventAction
{
    public function execute(Booking $booking, string $stage, ?Payment $payment = null): void
    {
        $booking->loadMissing('user');

        if (! $booking->user instanceof User) {
            return;
        }

        if ($this->alreadySent($booking, $stage, $payment)) {
            return;
        }

        $booking->user->notify(new BookingPaymentNotification($booking->fresh(), $stage, $payment?->fresh()));
    }

    private function alreadySent(Booking $booking, string $stage, ?Payment $payment = null): bool
    {
        return DB::table('notifications')
            ->where('type', BookingPaymentNotification::class)
            ->where('notifiable_type', (new User)->getMorphClass())
            ->where('notifiable_id', $booking->user_id)
            ->get()
            ->contains(function (object $notification) use ($booking, $stage, $payment): bool {
                $data = json_decode((string) $notification->data, true);

                if (! is_array($data)) {
                    return false;
                }

                if ((int) data_get($data, 'booking_id') !== (int) $booking->id) {
                    return false;
                }

                if (data_get($data, 'stage') !== $stage) {
                    return false;
                }

                if ($payment === null) {
                    return data_get($data, 'payment_id') === null;
                }

                return (int) data_get($data, 'payment_id') === (int) $payment->id;
            });
    }
}
