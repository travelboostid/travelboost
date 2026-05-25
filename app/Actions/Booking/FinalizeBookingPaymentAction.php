<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingPricingService;
use Illuminate\Support\Facades\DB;

class FinalizeBookingPaymentAction
{
    public function __construct(
        private readonly BookingPricingService $pricingService,
        private readonly SettleFullPaymentCommissionsAction $settlementAction,
    ) {}

    public function execute(Booking $booking, ?Payment $payment = null): void
    {
        $booking = DB::transaction(function () use ($booking, $payment): Booking {
            $lockedBooking = Booking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            $quote = $this->pricingService->quoteForBooking($lockedBooking);
            $lockedBooking->update($this->pricingService->bookingTotalsFromQuote($quote));

            $paidAmount = (float) $lockedBooking->payments()
                ->where('status', PaymentStatus::PAID->value)
                ->sum('amount');

            if ($paidAmount <= 0) {
                return $lockedBooking;
            }

            $targetStatus = $paidAmount >= (float) $quote['grand_total']
                ? BookingStatus::FULL_PAYMENT
                : BookingStatus::DOWN_PAYMENT;

            if ($targetStatus === BookingStatus::FULL_PAYMENT) {
                $this->settlementAction->execute($lockedBooking->fresh(), $payment, $quote);
            }

            $lockedBooking->update([
                'status' => $targetStatus,
                'reserved_expires_at' => null,
            ]);

            app(NotifyBookingPaymentEventAction::class)->execute(
                $lockedBooking->fresh(),
                $targetStatus === BookingStatus::FULL_PAYMENT
                    ? 'booking_full_payment'
                    : 'booking_down_payment',
                $payment
            );

            return $lockedBooking;
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
    }

    public function assertCanFinalizeIncomingPaidPayment(Booking $booking, Payment $payment): void
    {
        $this->assertCanFinalizeIncomingAmount($booking, (float) $payment->amount, (int) $payment->id);
    }

    public function assertCanFinalizeIncomingAmount(Booking $booking, float $incomingAmount, ?int $exceptPaymentId = null): void
    {
        $booking->loadMissing(['payments', 'tour.company.companySetting', 'passengers', 'addons']);
        $quote = $this->pricingService->quoteForBooking($booking);

        $paidPayments = $booking->payments()
            ->where('status', PaymentStatus::PAID->value);

        if ($exceptPaymentId !== null) {
            $paidPayments->whereKeyNot($exceptPaymentId);
        }

        $paidAmount = (float) $paidPayments->sum('amount');
        $paidAmount += $incomingAmount;

        if ($paidAmount < (float) $quote['grand_total']) {
            return;
        }

        $this->settlementAction->assertCanSettle($booking, $quote);
    }
}
