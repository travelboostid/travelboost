<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\BookingActionRequest;
use App\Services\BookingPaymentWorkflowService;

class BookingReschedulePayment
{
    private const MONEY_SCALE = 2;

    private const MONEY_EPSILON = 0.01;

    /**
     * @var array<int, array<string, mixed>|null>
     */
    private array $approvedReschedulePayloadCache = [];

    public function normalizeMoney(float $amount): float
    {
        return (float) round(max(0.0, $amount), self::MONEY_SCALE);
    }

    /**
     * @param  list<int>  $bookingIds
     */
    public function preloadApprovedReschedulePayloads(array $bookingIds): void
    {
        $missingIds = array_values(array_filter(
            $bookingIds,
            fn (int $bookingId): bool => ! array_key_exists($bookingId, $this->approvedReschedulePayloadCache),
        ));

        if ($missingIds === []) {
            return;
        }

        foreach ($missingIds as $bookingId) {
            $this->approvedReschedulePayloadCache[$bookingId] = null;
        }

        $requests = BookingActionRequest::query()
            ->select(['id', 'booking_id', 'payload', 'reviewed_at'])
            ->whereIn('booking_id', $missingIds)
            ->where('target_action', 'reschedule')
            ->where('status', 'approved')
            ->orderBy('booking_id')
            ->orderByDesc('reviewed_at')
            ->orderByDesc('id')
            ->get()
            ->unique('booking_id');

        foreach ($requests as $request) {
            $payload = $request->payload;

            $this->approvedReschedulePayloadCache[(int) $request->booking_id] = is_array($payload)
                ? $payload
                : null;
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    public function latestApprovedPayload(Booking $booking): ?array
    {
        if (array_key_exists($booking->id, $this->approvedReschedulePayloadCache)) {
            return $this->approvedReschedulePayloadCache[$booking->id];
        }

        $payload = BookingActionRequest::query()
            ->where('booking_id', $booking->id)
            ->where('target_action', 'reschedule')
            ->where('status', 'approved')
            ->orderByDesc('reviewed_at')
            ->orderByDesc('id')
            ->value('payload');

        $resolved = is_array($payload) ? $payload : null;
        $this->approvedReschedulePayloadCache[$booking->id] = $resolved;

        return $resolved;
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
