<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Midtrans\Transaction;
use Throwable;

class PaymentGatewayStatusSyncService
{
    public function __construct(
        private readonly PrismaLinkService $prismaLinkService,
        private readonly OnlinePaymentSettlementService $settlementService,
    ) {}

    /**
     * @return array{
     *     previous_status: string,
     *     status: string,
     *     changed: bool,
     *     transaction_status: string|null,
     *     payment: Payment,
     * }
     */
    public function sync(Payment $payment): array
    {
        $previousStatus = $payment->status;

        if ($previousStatus === PaymentStatus::PAID) {
            $this->settlementService->settle($payment);

            return [
                'previous_status' => $previousStatus->value,
                'status' => $previousStatus->value,
                'changed' => false,
                'transaction_status' => data_get($payment->payload, 'transaction_status'),
                'payment' => $payment->fresh(),
            ];
        }

        try {
            $gatewayData = $this->fetchGatewayStatus($payment);
        } catch (Throwable $exception) {
            Log::warning('Payment gateway status sync failed', [
                'payment_id' => $payment->id,
                'provider' => $payment->provider,
                'message' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        $newStatus = $this->mapGatewayStatus($payment, $gatewayData);

        DB::transaction(function () use ($payment, $gatewayData, $newStatus): void {
            $mergedPayload = match ($payment->provider) {
                'prismalink' => $this->mergePrismaLinkPayloadWithInstructions($payment, $gatewayData),
                default => Payment::mergeMidtransPayload($payment->payload ?? [], $gatewayData),
            };

            $payment->update([
                'status' => $newStatus,
                'payload' => $mergedPayload,
                'paid_at' => $newStatus === PaymentStatus::PAID
                    ? ($payment->paid_at ?? now())
                    : null,
            ]);

            if ($newStatus === PaymentStatus::PAID) {
                $this->settlementService->settle($payment->fresh());
            }
        });

        $payment = $payment->fresh();

        return [
            'previous_status' => $previousStatus->value,
            'status' => $payment->status->value,
            'changed' => $previousStatus !== $payment->status,
            'transaction_status' => data_get($gatewayData, 'transaction_status')
                ?? data_get($gatewayData, 'payment_status'),
            'payment' => $payment,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchGatewayStatus(Payment $payment): array
    {
        return match ($payment->provider) {
            'prismalink' => $this->fetchPrismaLinkStatus($payment),
            default => $this->fetchMidtransStatus($payment),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchMidtransStatus(Payment $payment): array
    {
        $orderId = data_get($payment->payload, 'order_id')
            ?? data_get($payment->payload, 'request.transaction_details.order_id');

        if (! is_string($orderId) || $orderId === '') {
            throw new \RuntimeException('Midtrans order ID is missing for this payment.');
        }

        return (array) Transaction::status($orderId);
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchPrismaLinkStatus(Payment $payment): array
    {
        $merchantRefNo = data_get($payment->payload, 'merchant_ref_no');
        $plinkRefNo = data_get($payment->payload, 'plink_ref_no');

        if (! is_string($merchantRefNo) || $merchantRefNo === '') {
            throw new \RuntimeException('PrismaLink merchant reference is missing for this payment.');
        }

        if (! is_string($plinkRefNo) || $plinkRefNo === '') {
            throw new \RuntimeException('PrismaLink reference is missing for this payment.');
        }

        return $this->prismaLinkService->checkTransactionStatus($merchantRefNo, $plinkRefNo);
    }

    /**
     * @param  array<string, mixed>  $gatewayData
     */
    private function mapGatewayStatus(Payment $payment, array $gatewayData): PaymentStatus
    {
        if ($payment->provider === 'prismalink') {
            return $this->prismaLinkService->mapPaymentStatus(
                $gatewayData['payment_status'] ?? $gatewayData['transaction_status'] ?? null,
            );
        }

        return $this->mapMidtransStatus($gatewayData['transaction_status'] ?? 'pending');
    }

    private function mapMidtransStatus(mixed $midtransStatus): PaymentStatus
    {
        return match ($midtransStatus) {
            'capture', 'settlement' => PaymentStatus::PAID,
            'pending' => PaymentStatus::PENDING,
            'deny', 'cancel', 'expire' => PaymentStatus::FAILED,
            default => PaymentStatus::PENDING,
        };
    }

    /**
     * @param  array<string, mixed>  $gatewayData
     * @return array<string, mixed>
     */
    private function mergePrismaLinkPayloadWithInstructions(Payment $payment, array $gatewayData): array
    {
        $mergedPayload = Payment::mergePrismaLinkPayload($payment->payload ?? [], $gatewayData);

        $instructions = $this->prismaLinkService->extractInstructions(
            array_merge($payment->payload ?? [], $gatewayData),
            $payment->payment_method,
            is_string(data_get($mergedPayload, 'bank')) ? data_get($mergedPayload, 'bank') : null,
        );

        if (($instructions['instruction_type'] ?? null) === 'unknown') {
            unset($instructions['instruction_type']);
        }

        return array_merge($mergedPayload, $instructions);
    }
}
