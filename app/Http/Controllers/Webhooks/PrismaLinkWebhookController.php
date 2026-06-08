<?php

namespace App\Http\Controllers\Webhooks;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\PrismaLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PrismaLinkWebhookController extends Controller
{
    public function __construct(
        private readonly PrismaLinkService $prismaLinkService,
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
            return response()->json(['ack' => true, 'message' => 'Payment already processed']);
        }

        $newStatus = $this->prismaLinkService->mapPaymentStatus(
            $payload['payment_status'] ?? $payload['transaction_status'] ?? null,
        );

        DB::transaction(function () use ($payment, $payload, $newStatus): void {
            $payment->update([
                'status' => $newStatus,
                'payload' => Payment::mergePrismaLinkPayload($payment->payload ?? [], $payload),
                'paid_at' => $newStatus === PaymentStatus::PAID ? now() : null,
            ]);

            if ($newStatus === PaymentStatus::PAID) {
                $this->processPayment($payment->fresh());
            }
        });

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

    private function processPayment(Payment $payment): void
    {
        match ($payment->payable_type) {
            'wallet-topup-payment' => $this->processWalletTopup($payment),
            default => $this->logUnknownPayableType($payment),
        };
    }

    private function processWalletTopup(Payment $payment): void
    {
        Log::info('Processing wallet topup via PrismaLink', ['payment_id' => $payment->id]);

        $owner = $payment->owner;
        if (! $owner) {
            Log::error('Owner not found', ['payment_id' => $payment->id]);

            return;
        }

        $payment->load('payable');
        $topup = $payment->payable;

        if (! $topup) {
            Log::error('Wallet topup payable not found', ['payment_id' => $payment->id]);

            return;
        }

        $owner->wallet->deposit($topup->amount, [
            'type' => 'wallet-topup',
            'description' => 'Wallet topup via PrismaLink',
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
        Log::warning('PrismaLink webhook received unknown payable type', [
            'payment_id' => $payment->id,
            'payable_type' => $payment->payable_type,
        ]);
    }
}
