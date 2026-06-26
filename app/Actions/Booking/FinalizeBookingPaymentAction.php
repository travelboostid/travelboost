<?php

namespace App\Actions\Booking;

use App\Actions\WaitingList\FulfillTourWaitingListFromBookingAction;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingPaymentWorkflowService;
use App\Services\BookingPricingService;
use Illuminate\Support\Facades\DB;

class FinalizeBookingPaymentAction
{
    /**
     * @var list<BookingStatus>
     */
    private const PAID_STATUS_RECONCILABLE_STATUSES = [
        BookingStatus::AWAITING_PAYMENT,
        BookingStatus::BOOKING_RESERVED,
        BookingStatus::RESERVED,
        BookingStatus::EXPIRED,
    ];

    public function __construct(
        private readonly BookingPricingService $pricingService,
        private readonly SettleFullPaymentCommissionsAction $settlementAction,
        private readonly BookingPaymentWorkflowService $paymentWorkflowService,
    ) {}

    public function execute(Booking $booking, ?Payment $payment = null, bool $notify = true): void
    {
        $booking = DB::transaction(function () use ($booking, $payment, $notify): Booking {
            $lockedBooking = Booking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            $quote = $this->pricingService->quoteForBooking($lockedBooking);
            $lockedBooking->update($this->pricingService->bookingTotalsFromQuote($quote));

            $paidAmount = $this->paymentWorkflowService->finalizablePaidAmount($lockedBooking);

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

            if ($notify) {
                app(NotifyBookingPaymentEventAction::class)->execute(
                    $lockedBooking->fresh(),
                    $targetStatus === BookingStatus::FULL_PAYMENT
                        ? 'booking_full_payment'
                        : 'booking_down_payment',
                    $payment
                );
            }

            return $lockedBooking;
        });

        $freshBooking = $booking->fresh();
        app(SyncAvailabilityAction::class)->executeForBooking($freshBooking);
        app(FulfillTourWaitingListFromBookingAction::class)->execute($freshBooking);
    }

    public function reconcilePaidStatusIfStale(Booking $booking, ?Payment $payment = null): bool
    {
        $booking = $booking->fresh();

        if (! in_array($booking->status, self::PAID_STATUS_RECONCILABLE_STATUSES, true)) {
            return false;
        }

        $paidAmount = $this->paymentWorkflowService->finalizablePaidAmount($booking);

        if ($paidAmount <= 0) {
            return false;
        }

        $this->execute($booking, $payment, notify: false);

        return true;
    }

    public function assertCanFinalizeIncomingPaidPayment(Booking $booking, Payment $payment): void
    {
        $this->assertCanFinalizeIncomingAmount($booking, (float) $payment->amount, (int) $payment->id);
    }

    public function assertCanFinalizeIncomingAmount(Booking $booking, float $incomingAmount, ?int $exceptPaymentId = null): void
    {
        $booking->loadMissing(['payments', 'tour.company.companySetting', 'passengers', 'addons']);
        $quote = $this->pricingService->quoteForBooking($booking);

        $paidAmount = $this->paymentWorkflowService->finalizablePaidAmount($booking, $exceptPaymentId);
        $paidAmount += $incomingAmount;

        if ($paidAmount < (float) $quote['grand_total']) {
            return;
        }

        $this->settlementAction->assertCanSettle($booking, $quote);
    }
}
