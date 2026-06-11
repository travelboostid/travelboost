<?php

namespace App\Services;

use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\NotifyBookingPaymentEventAction;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\AgentSubscriptionPayment;
use App\Models\AiCreditTopupPayment;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\WalletTopupPayment;
use Bavix\Wallet\Models\Transaction;
use Illuminate\Support\Facades\Log;

class OnlinePaymentSettlementService
{
    public function settle(Payment $payment): void
    {
        if ($payment->status !== PaymentStatus::PAID) {
            return;
        }

        $payment->load('payable', 'owner');

        match ($this->resolvePayableHandler($payment)) {
            'booking' => $this->settleBookingPayment($payment),
            'wallet-topup' => $this->settleWalletTopupPayment($payment),
            'agent-subscription' => $payment->payable?->onPaid($payment),
            'ai-credit-topup' => $this->settleAiCreditTopupPayment($payment),
            default => $this->logUnknownPayableType($payment),
        };
    }

    private function resolvePayableHandler(Payment $payment): string
    {
        return match ($payment->payable_type) {
            Booking::class => 'booking',
            WalletTopupPayment::class, 'wallet-topup-payment' => 'wallet-topup',
            AgentSubscriptionPayment::class, 'agent-subscription-payment' => 'agent-subscription',
            AiCreditTopupPayment::class, 'ai-credit-topup-payment' => 'ai-credit-topup',
            default => 'unknown',
        };
    }

    private function settleBookingPayment(Payment $payment): void
    {
        if (! $payment->payable instanceof Booking) {
            Log::error('Booking payable not found', ['payment_id' => $payment->id]);

            return;
        }

        $booking = $payment->payable;
        $paymentWorkflow = app(BookingPaymentWorkflowService::class);

        $booking->update([
            'payment_mode' => 'online',
        ]);

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

        app(NotifyBookingPaymentEventAction::class)->execute(
            $booking->fresh(),
            'online_payment_confirmed',
            $payment->fresh()
        );
    }

    private function settleWalletTopupPayment(Payment $payment): void
    {
        $owner = $payment->owner;

        if (! $owner) {
            Log::error('Owner not found for wallet topup', ['payment_id' => $payment->id]);

            return;
        }

        if (! $payment->payable instanceof WalletTopupPayment) {
            Log::error('Wallet topup payable not found', ['payment_id' => $payment->id]);

            return;
        }

        if ($this->hasWalletTopupDeposit($payment, $owner)) {
            return;
        }

        $topup = $payment->payable;

        $owner->wallet->deposit($topup->amount, [
            'type' => 'wallet-topup',
            'description' => 'Wallet topup via online payment',
            'payment_id' => $payment->id,
        ]);
    }

    private function settleAiCreditTopupPayment(Payment $payment): void
    {
        if ($this->isAiCreditTopupSettled($payment)) {
            return;
        }

        $owner = $payment->owner;

        if (! $owner) {
            Log::error('Owner not found for AI credit topup', ['payment_id' => $payment->id]);

            return;
        }

        if (! $payment->payable instanceof AiCreditTopupPayment) {
            Log::error('AI credit topup payable not found', ['payment_id' => $payment->id]);

            return;
        }

        $aiCredit = $owner->aiCredit()->first();

        if (! $aiCredit) {
            $owner->aiCredit()->create([
                'balance' => $payment->payable->amount,
            ]);
        } else {
            $aiCredit->increment('balance', $payment->payable->amount);
        }

        $payment->update([
            'payload' => array_merge($payment->payload ?? [], [
                'settled_at' => now()->toISOString(),
            ]),
        ]);
    }

    private function hasWalletTopupDeposit(Payment $payment, object $owner): bool
    {
        $wallet = $owner->wallet;

        if (! $wallet) {
            return false;
        }

        return Transaction::query()
            ->where('wallet_id', $wallet->id)
            ->where('amount', '>', 0)
            ->where('meta->payment_id', $payment->id)
            ->exists();
    }

    private function isAiCreditTopupSettled(Payment $payment): bool
    {
        return filled(data_get($payment->payload, 'settled_at'));
    }

    private function logUnknownPayableType(Payment $payment): void
    {
        Log::warning('Unknown payable type for online payment settlement', [
            'payment_id' => $payment->id,
            'payable_type' => $payment->payable_type,
        ]);
    }
}
