<?php

namespace App\Http\Controllers\Webhooks;

use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\NotifyBookingPaymentEventAction;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingContactPaymentEmailService;
use App\Services\BookingPaymentWorkflowService;
use App\Services\OnlinePaymentSettlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SnapBi\SnapBi;

class MidtransWebhookController extends Controller
{
    public function __construct(
        private readonly OnlinePaymentSettlementService $settlementService,
    ) {}

    public function handleNotification(Request $request): JsonResponse
    {
        if (! $this->isWebhookVerified($request)) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $payload = $request->all();
        $transactionId = $payload['order_id'] ?? null;

        if (! $transactionId) {
            return response()->json(['error' => 'No order ID'], 400);
        }

        $payment = $this->findPayment($transactionId);

        if (! $payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        if ($this->isAlreadyProcessed($payment)) {
            $this->reconcileAlreadyProcessedBookingPayment($payment);
            $this->settlementService->settle($payment);
            $this->sendBookingContactOnlinePaymentConfirmation($payment);

            return response()->json(['message' => 'Payment already processed']);
        }

        $newStatus = $this->mapMidtransStatus($payload['transaction_status'] ?? 'pending');

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
                'payload' => Payment::mergeMidtransPayload($payment->payload ?? [], $payload),
                'paid_at' => $newStatus === PaymentStatus::PAID ? now() : null,
            ]);

            if ($newStatus === PaymentStatus::PAID) {
                $this->processPayment($payment->fresh());
            } elseif ($payment->payable_type === Booking::class) {
                $this->notifyBookingPaymentEvent($payment->fresh(), $newStatus);
            }
        });

        $this->sendBookingContactOnlinePaymentConfirmation($payment);

        return response()->json(['message' => 'Webhook processed']);
    }

    private function isWebhookVerified(Request $request): bool
    {
        if (app()->environment('local', 'development', 'testing')) {
            return true;
        }

        $notificationUrlPath = config('app.url').'/webhooks/midtrans/notification';
        $verified = SnapBi::notification()
            ->withBody($request->getContent())
            ->withSignature($request->header('X-Signature'))
            ->withTimeStamp($request->header('X-Timestamp'))
            ->withNotificationUrlPath($notificationUrlPath)
            ->isWebhookNotificationVerified();

        if (! $verified) {
            Log::warning('Midtrans webhook signature verification failed', [
                'payload' => $request->all(),
                'headers' => $request->headers->all(),
            ]);
        }

        return $verified;
    }

    private function findPayment(string $transactionId): ?Payment
    {
        $paymentId = Str::before($transactionId, '-');

        return Payment::find($paymentId);
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

    private function mapMidtransStatus($midtransStatus)
    {
        return match ($midtransStatus) {
            'capture', 'settlement' => PaymentStatus::PAID,
            'pending' => PaymentStatus::PENDING,
            'deny', 'cancel', 'expire' => PaymentStatus::FAILED,
            default => PaymentStatus::PENDING,
        };
    }

    private function processPayment(Payment $payment): void
    {
        match ($payment->payable_type) {
            Booking::class => $this->processBookingPayment($payment),
            'agent-subscription-payment' => $this->processAgentSubscription($payment),
            'wallet-topup-payment' => $this->settlementService->settle($payment),
            'ai-credit-topup-payment' => $this->settlementService->settle($payment),
            default => $this->logUnknownPayableType($payment),
        };
    }

    private function processBookingPayment(Payment $payment): void
    {
        $payment->load('payable');
        $booking = $payment->payable;

        if (! $booking instanceof Booking) {
            Log::error('Booking payable not found', ['payment_id' => $payment->id]);

            return;
        }

        $booking->update([
            'payment_mode' => 'online',
        ]);

        $paymentWorkflow = app(BookingPaymentWorkflowService::class);

        if ($paymentWorkflow->isCustomerToAgentPayment($payment)) {
            $paymentWorkflow->markOnlineCustomerPaymentVerified($payment->fresh());
            $booking->fresh()->update([
                'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
                'reserved_expires_at' => null,
            ]);
        } elseif ($paymentWorkflow->isAgentToVendorPayment($payment)) {
            $booking->fresh()->update([
                'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
                'reserved_expires_at' => null,
            ]);
        } else {
            app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $payment);
        }

        $this->notifyBookingPaymentEvent($payment->fresh(), PaymentStatus::PAID);
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

    private function processAgentSubscription(Payment $payment): void
    {
        $payment->loadMissing('payable');

        if ($payment->payable && method_exists($payment->payable, 'onPaid')) {
            $payment->payable->onPaid($payment);
        }
    }

    private function processAiCreditTopup(Payment $payment): void
    {
        Log::info('Processing AI credit topup', ['payment_id' => $payment->id]);

        $owner = $payment->owner;
        if (! $owner) {
            Log::error('Owner not found', ['payment_id' => $payment->id]);

            return;
        }
        $payment->load('payable');
        if (! $payment->payable) {
            Log::error('Payable not found', ['payment_id' => $payment->id]);
        }
        $aiCredit = $owner->aiCredit()->first();
        if (! $aiCredit) {
            $owner->aiCredit()->create([
                'balance' => $payment->payable->amount,
            ]);
        } else {
            $aiCredit->increment('balance', $payment->payable->amount);
        }
    }

    private function processWalletTopup(Payment $payment): void
    {
        Log::info('Processing wallet topup', ['payment_id' => $payment->id]);

        $owner = $payment->owner;
        if (! $owner) {
            Log::error('Owner not found', ['payment_id' => $payment->id]);

            return;
        }

        $payment->load('payable');
        $topup = $payment->payable;

        $owner->wallet->deposit($topup->amount, [
            'type' => 'wallet-topup',
            'description' => 'Wallet topup via Midtrans',
            'payment_id' => $payment->id,
        ]);

        Log::info('Wallet topup successful', [
            'owner_id' => $payment->owner_id,
            'wallet_id' => $owner->wallet->id,
            'amount' => $topup->amount,
        ]);
    }

    private function logUnknownPayableType(Payment $payment): void
    {
        Log::warning('Unknown payable type', [
            'payment_id' => $payment->id,
            'payable_type' => $payment->payable_type,
        ]);
    }
}
