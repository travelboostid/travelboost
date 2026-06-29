<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Support\Carbon;

class ReusablePrismaLinkBookingPaymentAttemptService
{
    /**
     * @param  array<string, mixed>  $paymentWorkflowPayload
     */
    public function findReusableAttempt(
        Booking $booking,
        string $ownerType,
        int $ownerId,
        string $paymentType,
        float $amount,
        array $paymentWorkflowPayload,
    ): ?Payment {
        $expectedStage = data_get($paymentWorkflowPayload, 'payment_flow_stage');
        $expectedLinkedCustomerPaymentId = data_get($paymentWorkflowPayload, 'linked_customer_payment_id');

        return $booking->payments()
            ->where('provider', 'prismalink')
            ->where('owner_type', $ownerType)
            ->where('owner_id', $ownerId)
            ->whereIn('status', [PaymentStatus::UNPAID->value, PaymentStatus::PENDING->value])
            ->latest()
            ->get()
            ->first(function (Payment $payment) use ($paymentType, $amount, $expectedStage, $expectedLinkedCustomerPaymentId): bool {
                if (! $this->attemptMatches($payment, $paymentType, $amount, $expectedStage, $expectedLinkedCustomerPaymentId)) {
                    return false;
                }

                if ($this->attemptHasExpired($payment)) {
                    $this->markAttemptFailed($payment);

                    return false;
                }

                return filled(data_get($payment->payload, 'merchant_ref_no'))
                    && $this->hasPaymentInstructions($payment);
            });
    }

    private function attemptMatches(
        Payment $payment,
        string $paymentType,
        float $amount,
        mixed $expectedStage,
        mixed $expectedLinkedCustomerPaymentId,
    ): bool {
        if ($payment->bookingPaymentType() !== $paymentType) {
            return false;
        }

        if (round((float) $payment->amount, 2) !== round($amount, 2)) {
            return false;
        }

        $paymentStage = data_get($payment->payload, 'payment_flow_stage');
        if (blank($paymentStage) && $expectedStage === BookingPaymentWorkflowService::STAGE_DIRECT_TO_VENDOR) {
            $paymentStage = BookingPaymentWorkflowService::STAGE_DIRECT_TO_VENDOR;
        }

        if ((string) ($paymentStage ?? '') !== (string) ($expectedStage ?? '')) {
            return false;
        }

        if ((string) data_get($payment->payload, 'linked_customer_payment_id', '') !== (string) ($expectedLinkedCustomerPaymentId ?? '')) {
            return false;
        }

        return true;
    }

    private function hasPaymentInstructions(Payment $payment): bool
    {
        $payload = $payment->payload ?? [];

        if (filled(data_get($payload, 'instruction_type'))) {
            return true;
        }

        if (filled(data_get($payload, 'payment_page_url'))) {
            return true;
        }

        return filled(data_get($payload, 'va_number'));
    }

    private function attemptHasExpired(Payment $payment): bool
    {
        $legacyExpiresAt = data_get($payment->payload, 'charge_expires_at')
            ?? data_get($payment->payload, 'validity');

        if (filled($legacyExpiresAt) && Carbon::parse((string) $legacyExpiresAt)->isPast()) {
            return true;
        }

        return $payment->expired_at !== null && $payment->expired_at->isPast();
    }

    private function markAttemptFailed(Payment $payment): void
    {
        $payment->update([
            'status' => PaymentStatus::FAILED,
            'payload' => array_merge($payment->payload ?? [], [
                'charge_expired_at' => now()->toISOString(),
            ]),
        ]);
    }
}
