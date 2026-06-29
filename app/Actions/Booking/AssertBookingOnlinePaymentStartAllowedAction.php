<?php

namespace App\Actions\Booking;

use App\Enums\PaymentStatus;
use App\Models\Booking;
use Illuminate\Validation\ValidationException;

class AssertBookingOnlinePaymentStartAllowedAction
{
    public const PAYMENT_IN_PROGRESS_MESSAGE = 'A payment is already in progress for this booking. Please wait or refresh the page.';

    public function assert(Booking $booking): void
    {
        if ($booking->reserved_type === 'payment_in_progress') {
            throw ValidationException::withMessages([
                'payment' => self::PAYMENT_IN_PROGRESS_MESSAGE,
            ]);
        }

        $hasActiveOnlineAttempt = $booking->payments()
            ->where('provider', 'prismalink')
            ->whereIn('status', [
                PaymentStatus::UNPAID->value,
                PaymentStatus::PENDING->value,
            ])
            ->exists();

        if ($hasActiveOnlineAttempt) {
            throw ValidationException::withMessages([
                'payment' => self::PAYMENT_IN_PROGRESS_MESSAGE,
            ]);
        }
    }
}
