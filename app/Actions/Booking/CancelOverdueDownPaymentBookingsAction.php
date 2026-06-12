<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingPaymentWorkflowService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CancelOverdueDownPaymentBookingsAction
{
    private const BUSINESS_TIMEZONE = 'Asia/Jakarta';

    public function execute(): int
    {
        $today = CarbonImmutable::now(self::BUSINESS_TIMEZONE)->startOfDay();
        $cancelledCount = 0;

        Booking::query()
            ->with(['vendor.companySetting'])
            ->where('status', BookingStatus::DOWN_PAYMENT->value)
            ->whereNotNull('departure_date')
            ->chunkById(100, function ($bookings) use ($today, &$cancelledCount): void {
                foreach ($bookings as $booking) {
                    if (! $this->isOverdue($booking, $today)) {
                        continue;
                    }

                    $cancelledBooking = $this->cancelById((int) $booking->id, $today);

                    if ($cancelledBooking) {
                        app(SyncAvailabilityAction::class)->executeForBooking($cancelledBooking);
                        $cancelledCount++;
                    }
                }
            });

        return $cancelledCount;
    }

    private function cancelById(int $bookingId, CarbonImmutable $today): ?Booking
    {
        return DB::transaction(function () use ($bookingId, $today): ?Booking {
            $booking = Booking::query()
                ->with(['vendor.companySetting'])
                ->whereKey($bookingId)
                ->where('status', BookingStatus::DOWN_PAYMENT->value)
                ->whereNotNull('departure_date')
                ->lockForUpdate()
                ->first();

            if (! $booking || ! $this->isOverdue($booking, $today)) {
                return null;
            }

            $booking->update([
                'status' => BookingStatus::CANCELLED,
                'reserved_expires_at' => null,
            ]);

            $booking->payments()
                ->whereIn('status', [PaymentStatus::UNPAID->value, PaymentStatus::PENDING->value])
                ->update(['status' => PaymentStatus::CANCELLED->value]);

            $this->markPendingAgentVendorAttemptsInactive($booking);

            Log::info('Overdue down payment booking cancelled', [
                'booking_id' => $booking->id,
                'booking_number' => $booking->booking_number,
                'departure_date' => $booking->departure_date,
                'business_date' => $today->toDateString(),
            ]);

            return $booking->fresh();
        });
    }

    private function isOverdue(Booking $booking, CarbonImmutable $today): bool
    {
        if (! $booking->departure_date) {
            return false;
        }

        $deadlineDate = CarbonImmutable::parse($booking->departure_date, self::BUSINESS_TIMEZONE)
            ->startOfDay()
            ->subDays(max(0, (int) ($booking->vendor?->companySetting?->full_payment_deadline ?? 0)));

        return $deadlineDate->lt($today);
    }

    private function markPendingAgentVendorAttemptsInactive(Booking $booking): void
    {
        $booking->payments()
            ->where('status', PaymentStatus::CANCELLED->value)
            ->get()
            ->filter(fn (Payment $payment): bool => data_get($payment->payload, 'payment_flow_stage') === BookingPaymentWorkflowService::STAGE_AGENT_TO_VENDOR
                && data_get($payment->payload, 'vendor_review_status') === BookingPaymentWorkflowService::REVIEW_PENDING)
            ->each(function (Payment $payment): void {
                $payment->update([
                    'payload' => array_merge($payment->payload ?? [], [
                        'vendor_review_status' => 'cancelled',
                        'cancelled_at' => now()->toISOString(),
                    ]),
                ]);
            });
    }
}
