<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Services\BookingPaymentWorkflowService;

class ReconcileBookingPaymentAfterRepriceAction
{
    private const MONEY_EPSILON = 0.01;

    public function execute(
        Booking $booking,
        float $priceBefore,
        bool $applyCustomerPriceAdjustment = true,
    ): Booking {
        $booking = $booking->fresh();
        $paidAmount = app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($booking);
        $newTotal = (float) $booking->grand_total;

        if ($applyCustomerPriceAdjustment) {
            $targetStatus = $this->resolveTargetStatus($paidAmount, $newTotal);
            $booking->update(['status' => $targetStatus]);
            $booking = $booking->fresh();
        }

        $this->notifyCustomer(
            $booking,
            $paidAmount,
            $newTotal,
            $priceBefore,
            $applyCustomerPriceAdjustment,
        );

        return $booking;
    }

    public function resolveTargetStatus(float $paidAmount, float $newTotal): BookingStatus
    {
        $amountDue = max(0.0, $newTotal - $paidAmount);

        return $amountDue > self::MONEY_EPSILON
            ? BookingStatus::DOWN_PAYMENT
            : BookingStatus::FULL_PAYMENT;
    }

    private function notifyCustomer(
        Booking $booking,
        float $paidAmount,
        float $newTotal,
        float $priceBefore,
        bool $applyCustomerPriceAdjustment,
    ): void {
        if (! $applyCustomerPriceAdjustment) {
            app(NotifyBookingPaymentEventAction::class)->execute($booking, 'booking_rescheduled');

            return;
        }

        $creditAmount = max(0.0, $paidAmount - $newTotal);
        $amountDue = max(0.0, $newTotal - $paidAmount);

        if ($creditAmount > self::MONEY_EPSILON) {
            app(NotifyBookingPaymentEventAction::class)->execute($booking, 'booking_rescheduled_credit');

            return;
        }

        if ($amountDue > self::MONEY_EPSILON) {
            app(NotifyBookingPaymentEventAction::class)->execute($booking, 'booking_rescheduled_balance_due');

            return;
        }

        app(NotifyBookingPaymentEventAction::class)->execute($booking, 'booking_rescheduled');
    }
}
