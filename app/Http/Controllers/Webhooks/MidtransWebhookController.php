<?php

namespace App\Http\Controllers\Webhooks;

use App\Enums\AgentSubscriptionStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SnapBi\SnapBi;

class MidtransWebhookController extends Controller
{
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
            return response()->json(['message' => 'Payment already processed']);
        }

        $newStatus = $this->mapMidtransStatus($payload['transaction_status'] ?? 'pending');

        if ($newStatus === PaymentStatus::PAID) {
            $this->processPayment($payment);
        }

        $payment->update([
            'status' => $newStatus,
            'payload' => array_merge($payment->payload ?? [], $payload),
            'paid_at' => $newStatus === PaymentStatus::PAID ? now() : null,
        ]);

        return response()->json(['message' => 'Webhook processed']);
    }

    private function isWebhookVerified(Request $request): bool
    {
        if (app()->environment('local') || app()->environment('development')) {
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
            'agent-subscription-payment' => $this->processAgentSubscription($payment),
            'wallet-topup-payment' => $this->processWalletTopup($payment),
            'ai-credit-topup-payment' => $this->processAiCreditTopup($payment),
            default => $this->logUnknownPayableType($payment),
        };
    }

    private function processAgentSubscription(Payment $payment): void
    {
        Log::info('Processing agent subscription', ['payment_id' => $payment->id]);

        /**
         * @var Company
         */
        $owner = $payment->owner;
        if (! $owner) {
            Log::error('Owner not found', ['payment_id' => $payment->id]);

            return;
        }

        $package = $this->getAgentSubscriptionPackage($payment);
        if (! $package) {
            return;
        }

        $existingSubscription = $owner->agentSubscription()->first();

        if (! $existingSubscription) {
            $this->createNewSubscription($owner, $package);
        } else {
            $this->renewSubscription($existingSubscription, $package);
        }
    }

    private function getAgentSubscriptionPackage(Payment $payment): ?AgentSubscriptionPackage
    {
        $payment->load('payable');
        $payable = $payment->payable;

        if (! $payable) {
            Log::error('Payable not found', ['payment_id' => $payment->id]);

            return null;
        }

        $package = AgentSubscriptionPackage::find($payable->package_id);

        if (! $package) {
            Log::error('Package not found', ['payment_id' => $payment->id]);
        }

        return $package;
    }

    private function createNewSubscription(Company $owner, AgentSubscriptionPackage $package): void
    {
        $owner->agentSubscription()->create([
            'package_id' => $package->id,
            'started_at' => now(),
            'ended_at' => now()->addMonths($package->duration_months),
        ]);
    }

    private function renewSubscription($existingSubscription, AgentSubscriptionPackage $package): void
    {
        $newEndDate = $existingSubscription->status === AgentSubscriptionStatus::ACTIVE
          ? $existingSubscription->ended_at->addMonths($package->duration_months)
          : now()->addMonths($package->duration_months);

        $existingSubscription->update([
            'package_id' => $package->id,
            'started_at' => now(),
            'ended_at' => $newEndDate,
        ]);
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
            'type' => 'topup',
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
