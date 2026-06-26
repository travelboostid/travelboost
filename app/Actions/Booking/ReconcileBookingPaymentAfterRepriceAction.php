<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Services\BookingPaymentWorkflowService;
use App\Support\BookingReschedulePayment;

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

    public function reconcileStaleStatusIfBalanceDue(Booking $booking): Booking
    {
        $booking = $booking->fresh();
        $currentStatus = $booking->status instanceof BookingStatus
            ? $booking->status
            : BookingStatus::tryFrom((string) $booking->status);

        if (! in_array($currentStatus, [BookingStatus::DOWN_PAYMENT, BookingStatus::FULL_PAYMENT], true)) {
            return $booking;
        }

        $reschedulePayment = app(BookingReschedulePayment::class);

        if ($reschedulePayment->isPriceAdjustmentWaived($reschedulePayment->latestApprovedPayload($booking))) {
            return $booking;
        }

        $paidAmount = app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($booking);
        $targetStatus = $this->resolveTargetStatus($paidAmount, (float) $booking->grand_total);

        if ($targetStatus !== $currentStatus) {
            $booking->update(['status' => $targetStatus]);

            return $booking->fresh();
        }

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
