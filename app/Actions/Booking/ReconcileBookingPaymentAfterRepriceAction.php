<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Services\BookingPaymentWorkflowService;

class ReconcileBookingPaymentAfterRepriceAction
{
    public function execute(Booking $booking, float $priceBefore): Booking
    {
        $booking = $booking->fresh();
        $paidAmount = app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($booking);
        $newTotal = (float) $booking->grand_total;

        if ($paidAmount > 0) {
            $targetStatus = $paidAmount >= $newTotal
                ? BookingStatus::FULL_PAYMENT
                : BookingStatus::DOWN_PAYMENT;

            $booking->update(['status' => $targetStatus]);
            $booking = $booking->fresh();
        }

        $this->notifyCustomer($booking, $paidAmount, $newTotal, $priceBefore);

        return $booking;
    }

    private function notifyCustomer(Booking $booking, float $paidAmount, float $newTotal, float $priceBefore): void
    {
        $creditAmount = max(0.0, $paidAmount - $newTotal);
        $amountDue = max(0.0, $newTotal - $paidAmount);

        if ($creditAmount > 0.01 && $paidAmount > 0) {
            app(NotifyBookingPaymentEventAction::class)->execute($booking, 'booking_rescheduled_credit');

            return;
        }

        if ($amountDue > 0.01 && $newTotal > $priceBefore && $paidAmount > 0) {
            app(NotifyBookingPaymentEventAction::class)->execute($booking, 'booking_rescheduled_balance_due');

            return;
        }

        app(NotifyBookingPaymentEventAction::class)->execute($booking, 'booking_rescheduled');
    }
}
