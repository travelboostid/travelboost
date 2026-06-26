<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\BookingActionRequest;
use App\Services\BookingPaymentWorkflowService;

class BookingReschedulePayment
{
    private const MONEY_SCALE = 2;

    private const MONEY_EPSILON = 0.01;

    public function normalizeMoney(float $amount): float
    {
        return (float) round(max(0.0, $amount), self::MONEY_SCALE);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function latestApprovedPayload(Booking $booking): ?array
    {
        $payload = BookingActionRequest::query()
            ->where('booking_id', $booking->id)
            ->where('target_action', 'reschedule')
            ->where('status', 'approved')
            ->orderByDesc('reviewed_at')
            ->orderByDesc('id')
            ->value('payload');

        return is_array($payload) ? $payload : null;
    }

    public function isPriceAdjustmentWaived(?array $payload): bool
    {
        return $payload !== null
            && data_get($payload, 'apply_customer_price_adjustment', true) === false;
    }

    public function effectiveGrandTotalForPayment(Booking $booking, ?float $paidAmount = null): float
    {
        $grandTotal = (float) $booking->grand_total;
        $payload = $this->latestApprovedPayload($booking);

        if ($payload === null || ! $this->isPriceAdjustmentWaived($payload)) {
            return $this->normalizeMoney($grandTotal);
        }

        $priceBefore = (float) data_get($payload, 'price_before', $grandTotal);

        return $this->normalizeMoney(min($grandTotal, $priceBefore));
    }

    public function remainingBalance(Booking $booking, ?float $paidAmount = null): float
    {
        $paidAmount ??= app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($booking);
        $grandTotalForPayment = $this->effectiveGrandTotalForPayment($booking, $paidAmount);

        return $this->normalizeMoney($grandTotalForPayment - $paidAmount);
    }

    public function isFullyPaid(Booking $booking, float $paidAmount): bool
    {
        return $this->remainingBalance($booking, $paidAmount) <= self::MONEY_EPSILON;
    }
}
