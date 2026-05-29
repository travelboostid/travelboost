<?php

namespace App\Actions\Booking;

use App\Models\Booking;
use App\Models\Company;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\BookingManualPaymentReviewNotification;
use App\Notifications\BookingPaymentNotification;
use App\Services\BookingPaymentReceiverService;
use Illuminate\Support\Facades\DB;

class NotifyBookingPaymentEventAction
{
    public function execute(Booking $booking, string $stage, ?Payment $payment = null): void
    {
        $booking->loadMissing(['user', 'vendor', 'agent']);

        if ($booking->user instanceof User && ! $this->alreadySentToCustomer($booking, $stage, $payment)) {
            $booking->user->notify(new BookingPaymentNotification($booking->fresh(), $stage, $payment?->fresh()));
        }

        if ($stage !== 'manual_payment_submitted' || ! $payment) {
            return;
        }

        $receiverCompany = app(BookingPaymentReceiverService::class)
            ->resolveForBooking($booking)['receiver_company'];

        if (! $receiverCompany instanceof Company) {
            return;
        }

        if ($this->alreadySentToCompany($receiverCompany, $booking, $stage, $payment)) {
            return;
        }

        $receiverCompany = $receiverCompany->fresh() ?? $receiverCompany;

        $receiverCompany->notify(new BookingManualPaymentReviewNotification(
            $booking->fresh(),
            $payment->fresh(),
            $receiverCompany
        ));
    }

    private function alreadySentToCustomer(Booking $booking, string $stage, ?Payment $payment = null): bool
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

    private function alreadySentToCompany(Company $company, Booking $booking, string $stage, Payment $payment): bool
    {
        return DB::table('notifications')
            ->where('type', BookingManualPaymentReviewNotification::class)
            ->where('notifiable_type', (new Company)->getMorphClass())
            ->where('notifiable_id', $company->id)
            ->get()
            ->contains(function (object $notification) use ($booking, $stage, $payment): bool {
                $data = json_decode((string) $notification->data, true);

                if (! is_array($data)) {
                    return false;
                }

                return (int) data_get($data, 'booking_id') === (int) $booking->id
                    && data_get($data, 'type') === 'booking_manual_payment_review'
                    && data_get($data, 'stage') === $stage
                    && (int) data_get($data, 'payment_id') === (int) $payment->id;
            });
    }
}
