<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Payment;
use App\Notifications\BookingPaymentReviewStatusNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Throwable;

class BookingContactPaymentEmailService
{
    private const ONLINE_CONFIRMATION_ATTEMPTED_AT = 'notifications.booking_contact_online_payment_confirmation_attempted_at';

    public function sendOnlinePaymentConfirmedIfEligible(Booking $booking, Payment $payment): void
    {
        $booking = $booking->fresh(['tour', 'agent', 'vendor']) ?? $booking;
        $payment = $payment->fresh() ?? $payment;

        if (! $this->shouldSendOnlineConfirmation($booking, $payment)) {
            return;
        }

        $company = $this->confirmationCompany($booking);

        if (! $company || ! $this->claimOnlineConfirmationAttempt($payment)) {
            return;
        }

        try {
            Notification::route('mail', $booking->contact_email)
                ->notify(new BookingPaymentReviewStatusNotification(
                    booking: $booking,
                    payment: $payment->fresh() ?? $payment,
                    reviewerCompany: $company,
                    decision: 'online_confirmed',
                ));
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    private function shouldSendOnlineConfirmation(Booking $booking, Payment $payment): bool
    {
        return filled($booking->contact_email)
            && $this->bookingStatus($booking) === BookingStatus::FULL_PAYMENT
            && $this->paymentStatus($payment) === PaymentStatus::PAID
            && in_array($payment->provider, ['midtrans', 'prismalink'], true)
            && $payment->bookingPaymentType() === Payment::BOOKING_PAYMENT_TYPE_FULL_PAYMENT
            && ! filled(data_get($payment->payload, self::ONLINE_CONFIRMATION_ATTEMPTED_AT));
    }

    private function confirmationCompany(Booking $booking): ?Company
    {
        $booking->loadMissing(['agent', 'vendor']);

        $receiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
        $receiverCompany = $receiver['receiver_company'] ?? null;

        if ($receiverCompany instanceof Company) {
            return $receiverCompany;
        }

        if ($booking->vendor instanceof Company) {
            return $booking->vendor;
        }

        return $booking->agent instanceof Company ? $booking->agent : null;
    }

    private function claimOnlineConfirmationAttempt(Payment $payment): bool
    {
        return DB::transaction(function () use ($payment): bool {
            $lockedPayment = Payment::query()
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedPayment || filled(data_get($lockedPayment->payload, self::ONLINE_CONFIRMATION_ATTEMPTED_AT))) {
                return false;
            }

            $payload = $lockedPayment->payload ?? [];
            data_set($payload, self::ONLINE_CONFIRMATION_ATTEMPTED_AT, now()->toISOString());

            $lockedPayment->forceFill(['payload' => $payload])->save();

            return true;
        });
    }

    private function bookingStatus(Booking $booking): ?BookingStatus
    {
        if ($booking->status instanceof BookingStatus) {
            return $booking->status;
        }

        return BookingStatus::tryFrom((string) $booking->status);
    }

    private function paymentStatus(Payment $payment): ?PaymentStatus
    {
        if ($payment->status instanceof PaymentStatus) {
            return $payment->status;
        }

        return PaymentStatus::tryFrom((string) $payment->status);
    }
}
