<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;

class FinalizeBookingPaymentAction
{
    public function execute(Booking $booking): void
    {
        $paidAmount = (float) $booking->payments()
            ->where('status', PaymentStatus::PAID->value)
            ->sum('amount');

        if ($paidAmount <= 0) {
            return;
        }

        $targetStatus = $paidAmount >= (float) $booking->grand_total
            ? BookingStatus::FULL_PAYMENT
            : BookingStatus::DOWN_PAYMENT;

        $booking->update([
            'status' => $targetStatus,
            'reserved_expires_at' => null,
        ]);

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
    }
}
