<?php

namespace App\Http\Controllers\Webhooks;

use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\NotifyBookingPaymentEventAction;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingContactPaymentEmailService;
use App\Services\BookingPaymentWorkflowService;
use App\Services\OnlinePaymentSettlementService;
use App\Services\PrismaLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PrismaLinkWebhookController extends Controller
{
    public function __construct(
        private readonly PrismaLinkService $prismaLinkService,
        private readonly OnlinePaymentSettlementService $settlementService,
    ) {}

    public function backendCallback(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $mac = (string) $request->header('mac', '');

        if (! $this->prismaLinkService->verifyNotificationMac($rawBody, $mac)) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $payload = $request->all();
        $merchantRefNo = $payload['merchant_ref_no'] ?? null;

        if (! is_string($merchantRefNo) || $merchantRefNo === '') {
            return response()->json(['error' => 'No merchant reference number'], 400);
        }

        $payment = $this->findPayment($merchantRefNo);

        if (! $payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        if ($payment->provider !== 'prismalink') {
            return response()->json(['error' => 'Invalid payment provider'], 422);
        }

        if ($this->isAlreadyProcessed($payment)) {
            $this->reconcileAlreadyProcessedBookingPayment($payment);
            $this->settlementService->settle($payment);
            $this->sendBookingContactOnlinePaymentConfirmation($payment);

            return response()->json(['ack' => true, 'message' => 'Payment already processed']);
        }

        $newStatus = $this->prismaLinkService->mapPaymentStatus(
            $payload['payment_status'] ?? $payload['transaction_status'] ?? null,
        );

        DB::transaction(function () use ($payment, $payload, $newStatus): void {
            $paymentWorkflow = app(BookingPaymentWorkflowService::class);

            if (
                $newStatus === PaymentStatus::PAID
                && $payment->payable_type === Booking::class
                && ! $paymentWorkflow->isCustomerToAgentPayment($payment)
                && ! $paymentWorkflow->isAgentToVendorPayment($payment)
            ) {
                $booking = $payment->payable;
                if ($booking instanceof Booking) {
                    app(FinalizeBookingPaymentAction::class)
                        ->assertCanFinalizeIncomingPaidPayment($booking->fresh(), $payment->fresh());
                }
            }

            $payment->update([
                'status' => $newStatus,
                'payload' => Payment::mergePrismaLinkPayload($payment->payload ?? [], $payload),
                'paid_at' => $newStatus === PaymentStatus::PAID ? now() : null,
            ]);

            if ($newStatus === PaymentStatus::PAID) {
                $this->settlementService->settle($payment->fresh());
            } elseif ($payment->payable_type === Booking::class) {
                $this->notifyBookingPaymentEvent($payment->fresh(), $newStatus);
            }
        });

        $this->sendBookingContactOnlinePaymentConfirmation($payment->fresh());

        return response()->json(['ack' => true]);
    }

    private function findPayment(string $merchantRefNo): ?Payment
    {
        $payment = Payment::query()
            ->where('provider', 'prismalink')
            ->where('payload->merchant_ref_no', $merchantRefNo)
            ->first();

        if ($payment !== null) {
            return $payment;
        }

        $paymentId = $this->prismaLinkService->parsePaymentIdFromMerchantRefNo($merchantRefNo);

        if ($paymentId === null) {
            return null;
        }

        return Payment::query()
            ->where('provider', 'prismalink')
            ->find($paymentId);
    }

    private function isAlreadyProcessed(Payment $payment): bool
    {
        return $payment->status === PaymentStatus::PAID;
    }

    private function reconcileAlreadyProcessedBookingPayment(Payment $payment): void
    {
        if ($payment->payable_type !== Booking::class) {
            return;
        }

        $payment->load('payable');

        if (! $payment->payable instanceof Booking) {
            return;
        }

        app(FinalizeBookingPaymentAction::class)->reconcilePaidStatusIfStale(
            $payment->payable->fresh(),
            $payment->fresh()
        );
    }

    private function sendBookingContactOnlinePaymentConfirmation(Payment $payment): void
    {
        $payment = $payment->fresh();

        if (! $payment || $payment->payable_type !== Booking::class) {
            return;
        }

        $payment->load('payable');

        if (! $payment->payable instanceof Booking) {
            return;
        }

        app(BookingContactPaymentEmailService::class)
            ->sendOnlinePaymentConfirmedIfEligible($payment->payable->fresh(), $payment);
    }

    private function notifyBookingPaymentEvent(Payment $payment, PaymentStatus $status): void
    {
        $payment->load('payable');

        if (! $payment->payable instanceof Booking) {
            return;
        }

        app(NotifyBookingPaymentEventAction::class)->execute(
            $payment->payable->fresh(),
            match ($status) {
                PaymentStatus::PAID => 'online_payment_confirmed',
                PaymentStatus::FAILED => 'online_payment_failed',
                default => 'online_payment_pending',
            },
            $payment->fresh()
        );
    }
}
