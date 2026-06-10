<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BookingPaymentWorkflowService
{
    public const STAGE_DIRECT_TO_VENDOR = 'direct_to_vendor';

    public const STAGE_CUSTOMER_TO_AGENT = 'customer_to_agent';

    public const STAGE_AGENT_TO_VENDOR = 'agent_to_vendor';

    public const REVIEW_PENDING = 'pending';

    public const REVIEW_APPROVED = 'approved';

    public const REVIEW_DECLINED = 'declined';

    public function __construct(
        private readonly BookingPaymentReceiverService $receiverService,
    ) {}

    /**
     * @param  array{payment_mode: string, receiver_type: string, receiver_company: Company|null}  $paymentReceiver
     * @return array<string, mixed>
     */
    public function initialPaymentPayload(array $paymentReceiver, string $paymentType): array
    {
        $stage = $paymentReceiver['payment_mode'] === 'agent' && $paymentReceiver['receiver_type'] === 'agent'
            ? self::STAGE_CUSTOMER_TO_AGENT
            : self::STAGE_DIRECT_TO_VENDOR;

        $payload = [
            'booking_payment_type' => $paymentType,
            'payment_type' => $paymentType,
            'payment_receiver_type' => $paymentReceiver['receiver_type'],
            'payment_receiver_company_id' => $paymentReceiver['receiver_company']?->id,
            'partnership_payment_mode' => $paymentReceiver['payment_mode'],
            'payment_flow_stage' => $stage,
            'counts_toward_booking_total' => $stage === self::STAGE_DIRECT_TO_VENDOR,
        ];

        if ($stage === self::STAGE_CUSTOMER_TO_AGENT) {
            $payload['agent_review_status'] = self::REVIEW_PENDING;
            $payload['vendor_review_status'] = null;
        }

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    public function agentVendorPaymentPayload(Booking $booking, Payment $customerPayment, string $paymentType): array
    {
        $booking->loadMissing('vendor');

        return [
            'booking_payment_type' => $paymentType,
            'payment_type' => $paymentType,
            'payment_receiver_type' => 'vendor',
            'payment_receiver_company_id' => $booking->vendor?->id,
            'partnership_payment_mode' => 'agent',
            'payment_flow_stage' => self::STAGE_AGENT_TO_VENDOR,
            'linked_customer_payment_id' => $customerPayment->id,
            'vendor_review_status' => self::REVIEW_PENDING,
            'counts_toward_booking_total' => false,
        ];
    }

    public function agentVendorCustomerPaymentForDashboardPayment(Company $company, Booking $booking): ?Payment
    {
        if (! $this->bookingAllowsAgentCollectionAction($booking)) {
            return null;
        }

        if (($company->type->value ?? $company->type) !== 'agent') {
            return null;
        }

        if ((int) $booking->agent_id !== (int) $company->id) {
            return null;
        }

        if (! $this->isAgentCollectionBooking($booking)) {
            return null;
        }

        return $this->verifiedCustomerPaymentAwaitingAgentVendorPayment($booking);
    }

    public function assertAgentVendorPaymentMatchesCustomerPayment(Payment $customerPayment, float $amount, string $paymentType): void
    {
        if ((float) $customerPayment->amount !== $amount) {
            throw ValidationException::withMessages([
                'payment' => 'Agent payment to vendor must match the customer payment amount.',
            ]);
        }

        if ($customerPayment->bookingPaymentType() !== $paymentType) {
            throw ValidationException::withMessages([
                'payment_type' => 'Agent payment to vendor must use the same payment type as the customer payment.',
            ]);
        }
    }

    public function isAgentCollectionBooking(Booking $booking): bool
    {
        $paymentReceiver = $this->receiverService->resolveForBooking($booking);

        return $paymentReceiver['payment_mode'] === 'agent'
            && $paymentReceiver['receiver_type'] === 'agent';
    }

    public function isCustomerToAgentPayment(Payment $payment): bool
    {
        return data_get($payment->payload, 'payment_flow_stage') === self::STAGE_CUSTOMER_TO_AGENT;
    }

    public function isAgentToVendorPayment(Payment $payment): bool
    {
        return data_get($payment->payload, 'payment_flow_stage') === self::STAGE_AGENT_TO_VENDOR;
    }

    public function isDirectBookingPayment(Payment $payment): bool
    {
        $stage = data_get($payment->payload, 'payment_flow_stage');

        return $stage === null || $stage === self::STAGE_DIRECT_TO_VENDOR;
    }

    public function paymentCountsTowardBookingTotal(Payment $payment): bool
    {
        if ($this->isAgentToVendorPayment($payment)) {
            return false;
        }

        if ($this->isCustomerToAgentPayment($payment)) {
            return data_get($payment->payload, 'vendor_review_status') === self::REVIEW_APPROVED
                && data_get($payment->payload, 'counts_toward_booking_total') === true;
        }

        return data_get($payment->payload, 'counts_toward_booking_total', true) !== false;
    }

    /**
     * @return Collection<int, Payment>
     */
    public function finalizablePaidPayments(Booking $booking): Collection
    {
        $booking->loadMissing('payments');

        return $booking->payments
            ->filter(fn (Payment $payment): bool => $payment->status === PaymentStatus::PAID
                && $this->paymentCountsTowardBookingTotal($payment))
            ->values();
    }

    public function finalizablePaidAmount(Booking $booking, ?int $exceptPaymentId = null): float
    {
        return (float) $this->finalizablePaidPayments($booking)
            ->reject(fn (Payment $payment): bool => $exceptPaymentId !== null && (int) $payment->id === $exceptPaymentId)
            ->sum(fn (Payment $payment): float => (float) $payment->amount);
    }

    public function latestFinalizablePaidPayment(Booking $booking): ?Payment
    {
        return $this->finalizablePaidPayments($booking)
            ->sortByDesc(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
            ->first();
    }

    public function approveCustomerPaymentByAgent(Payment $payment, ?User $reviewer = null): void
    {
        $payment->update([
            'payload' => array_merge($payment->payload ?? [], [
                'agent_review_status' => self::REVIEW_APPROVED,
                'agent_reviewed_at' => now()->toISOString(),
                'agent_reviewed_by' => $reviewer?->id,
                'counts_toward_booking_total' => false,
            ]),
        ]);
    }

    public function markOnlineCustomerPaymentVerified(Payment $payment): void
    {
        if (! $this->isCustomerToAgentPayment($payment)) {
            return;
        }

        $this->approveCustomerPaymentByAgent($payment);
    }

    public function approveAgentVendorPaymentByVendor(Payment $agentVendorPayment, Payment $customerPayment, ?User $reviewer = null): void
    {
        $agentVendorPayment->update([
            'payload' => array_merge($agentVendorPayment->payload ?? [], [
                'vendor_review_status' => self::REVIEW_APPROVED,
                'vendor_reviewed_at' => now()->toISOString(),
                'vendor_reviewed_by' => $reviewer?->id,
                'counts_toward_booking_total' => false,
            ]),
        ]);

        $customerPayment->update([
            'payload' => array_merge($customerPayment->payload ?? [], [
                'vendor_review_status' => self::REVIEW_APPROVED,
                'vendor_reviewed_at' => now()->toISOString(),
                'vendor_reviewed_by' => $reviewer?->id,
                'counts_toward_booking_total' => true,
            ]),
        ]);
    }

    public function declineAgentVendorPaymentByVendor(Payment $agentVendorPayment, ?User $reviewer = null): void
    {
        $agentVendorPayment->update([
            'status' => PaymentStatus::FAILED,
            'payload' => array_merge($agentVendorPayment->payload ?? [], [
                'vendor_review_status' => self::REVIEW_DECLINED,
                'vendor_reviewed_at' => now()->toISOString(),
                'vendor_reviewed_by' => $reviewer?->id,
                'declined_at' => now()->toISOString(),
            ]),
        ]);
    }

    public function customerPaymentForAgentVendorPayment(Booking $booking, Payment $agentVendorPayment): ?Payment
    {
        $customerPaymentId = data_get($agentVendorPayment->payload, 'linked_customer_payment_id');

        if (! $customerPaymentId) {
            return null;
        }

        return $booking->payments
            ->first(fn (Payment $payment): bool => (int) $payment->id === (int) $customerPaymentId
                && $this->isCustomerToAgentPayment($payment));
    }

    public function canCompanyReviewPayment(Company $company, Booking $booking, Payment $payment): bool
    {
        if (
            ($this->isCustomerToAgentPayment($payment) || $this->isAgentToVendorPayment($payment))
            && ! $this->bookingAllowsAgentCollectionAction($booking)
        ) {
            return false;
        }

        if ($this->isCustomerToAgentPayment($payment)) {
            return ($company->type->value ?? $company->type) === 'agent'
                && (int) $booking->agent_id === (int) $company->id
                && $payment->provider === 'manual'
                && $payment->payment_method === 'bank_transfer'
                && $payment->status === PaymentStatus::PENDING;
        }

        if ($this->isAgentToVendorPayment($payment)) {
            return ($company->type->value ?? $company->type) === 'vendor'
                && (int) $booking->vendor_id === (int) $company->id
                && data_get($payment->payload, 'vendor_review_status') === self::REVIEW_PENDING
                && (
                    ($payment->provider === 'manual' && $payment->payment_method === 'bank_transfer' && $payment->status === PaymentStatus::PENDING)
                    || ($payment->provider === 'midtrans' && $payment->status === PaymentStatus::PAID)
                );
        }

        return $this->receiverService->companyCanReviewManualPayment($company, $booking)
            && $payment->provider === 'manual'
            && $payment->payment_method === 'bank_transfer'
            && $payment->status === PaymentStatus::PENDING;
    }

    public function reviewablePaymentForCompany(Company $company, Booking $booking): ?Payment
    {
        $booking->loadMissing('payments');

        return $booking->payments
            ->sortByDesc('created_at')
            ->first(fn (Payment $payment): bool => $this->canCompanyReviewPayment($company, $booking, $payment));
    }

    /**
     * @return array<string, mixed>
     */
    public function workflowPayload(Company $company, Booking $booking): array
    {
        if (! $this->isAgentCollectionBooking($booking)) {
            return [
                'mode' => 'direct',
                'stage' => 'direct_payment',
                'customer_payment' => null,
                'agent_vendor_payment' => null,
                'can_review_customer_payment' => false,
                'can_pay_vendor' => false,
                'can_review_agent_vendor_payment' => false,
                'vendor_bank_info' => null,
            ];
        }

        $booking->loadMissing('payments', 'vendor.companySetting');
        $customerPayment = $this->latestCustomerToAgentPayment($booking);
        $agentVendorPayment = $this->latestReviewableAgentVendorPayment($booking, $customerPayment);
        $reviewablePayment = $this->bookingAllowsAgentCollectionAction($booking)
            ? $this->reviewablePaymentForCompany($company, $booking)
            : null;

        $stage = match (true) {
            ! $this->bookingAllowsAgentCollectionAction($booking) => 'closed',
            $customerPayment === null => 'customer_payment_due',
            $customerPayment->status === PaymentStatus::PENDING => 'customer_review',
            $agentVendorPayment !== null
                && $this->agentVendorPaymentAwaitsVendorReview($agentVendorPayment) => 'vendor_review',
            $this->verifiedCustomerPaymentAwaitingAgentVendorPayment($booking) !== null => 'agent_vendor_payment_due',
            data_get($customerPayment->payload, 'vendor_review_status') === self::REVIEW_APPROVED => 'complete',
            default => 'agent_vendor_payment_due',
        };

        return [
            'mode' => 'agent_collection',
            'stage' => $stage,
            'customer_payment' => $customerPayment ? $this->paymentSummary($customerPayment) : null,
            'agent_vendor_payment' => $agentVendorPayment ? $this->paymentSummary($agentVendorPayment) : null,
            'can_review_customer_payment' => $reviewablePayment !== null && $this->isCustomerToAgentPayment($reviewablePayment),
            'can_pay_vendor' => $this->agentVendorCustomerPaymentForDashboardPayment($company, $booking) !== null,
            'can_review_agent_vendor_payment' => $reviewablePayment !== null && $this->isAgentToVendorPayment($reviewablePayment),
            'vendor_bank_info' => [
                'bankName' => $booking->vendor?->companySetting?->manual_bank_transfer ?? '',
                'accountName' => $booking->vendor?->companySetting?->manual_bank_transfer_account_name ?? '',
                'accountNumber' => $booking->vendor?->companySetting?->manual_bank_transfer_account_number ?? '',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function paymentSummary(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'provider' => $payment->provider,
            'payment_method' => $payment->payment_method,
            'amount' => (float) $payment->amount,
            'status' => $payment->status->value,
            'payment_type' => $payment->bookingPaymentType(),
            'payment_flow_stage' => data_get($payment->payload, 'payment_flow_stage'),
            'payment_date' => data_get($payment->payload, 'payment_date') ?: ($payment->paid_at ?? $payment->created_at)?->toJSON(),
            'receipt' => $this->receiptPayload($payment),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function receiptPayload(Payment $payment): ?array
    {
        if ($payment->provider === 'manual') {
            $proofPath = data_get($payment->payload, 'proof_path');

            return [
                'type' => 'manual',
                'url' => filled($proofPath) ? Storage::disk('public')->url((string) $proofPath) : null,
                'provider' => $payment->provider,
                'method' => $payment->payment_method,
                'order_id' => null,
                'transaction_id' => null,
                'status' => $payment->status->value,
                'raw' => null,
            ];
        }

        if ($payment->provider !== 'midtrans') {
            return null;
        }

        $gateway = Payment::gatewayNotificationData($payment->payload ?? []);

        return [
            'type' => 'online',
            'url' => null,
            'provider' => $payment->provider,
            'method' => (string) (data_get($gateway, 'payment_type') ?: $payment->payment_method),
            'order_id' => data_get($payment->payload, 'order_id') ?: data_get($gateway, 'order_id'),
            'transaction_id' => data_get($gateway, 'transaction_id'),
            'status' => data_get($gateway, 'transaction_status') ?: $payment->status->value,
            'raw' => null,
        ];
    }

    private function verifiedCustomerPaymentAwaitingAgentVendorPayment(Booking $booking): ?Payment
    {
        if (! $this->bookingAllowsAgentCollectionAction($booking)) {
            return null;
        }

        $booking->loadMissing('payments');

        return $booking->payments
            ->filter(fn (Payment $payment): bool => $this->isCustomerToAgentPayment($payment)
                && $payment->status === PaymentStatus::PAID
                && data_get($payment->payload, 'agent_review_status') === self::REVIEW_APPROVED
                && data_get($payment->payload, 'vendor_review_status') !== self::REVIEW_APPROVED
                && ! $this->hasActiveAgentVendorPayment($booking, $payment))
            ->sortByDesc(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
            ->first();
    }

    private function hasActiveAgentVendorPayment(Booking $booking, Payment $customerPayment): bool
    {
        return $booking->payments
            ->contains(fn (Payment $payment): bool => $this->isAgentToVendorPayment($payment)
                && (int) data_get($payment->payload, 'linked_customer_payment_id') === (int) $customerPayment->id
                && data_get($payment->payload, 'vendor_review_status') === self::REVIEW_PENDING
                && $this->agentVendorPaymentAwaitsVendorReview($payment));
    }

    private function agentVendorPaymentAwaitsVendorReview(Payment $payment): bool
    {
        if (data_get($payment->payload, 'vendor_review_status') !== self::REVIEW_PENDING) {
            return false;
        }

        if ($payment->provider === 'manual') {
            return $payment->status === PaymentStatus::PENDING;
        }

        if ($payment->provider === 'midtrans') {
            return $payment->status === PaymentStatus::PAID;
        }

        return false;
    }

    private function latestCustomerToAgentPayment(Booking $booking): ?Payment
    {
        return $booking->payments
            ->filter(fn (Payment $payment): bool => $this->isCustomerToAgentPayment($payment))
            ->sortByDesc('created_at')
            ->first();
    }

    private function latestReviewableAgentVendorPayment(Booking $booking, ?Payment $customerPayment = null): ?Payment
    {
        if (! $this->bookingAllowsAgentCollectionAction($booking)) {
            return null;
        }

        return $booking->payments
            ->filter(fn (Payment $payment): bool => $this->isAgentToVendorPayment($payment)
                && ($customerPayment === null || (int) data_get($payment->payload, 'linked_customer_payment_id') === (int) $customerPayment->id)
                && $this->agentVendorPaymentAwaitsVendorReview($payment))
            ->sortByDesc('created_at')
            ->first();
    }

    private function bookingAllowsAgentCollectionAction(Booking $booking): bool
    {
        $status = $booking->status instanceof BookingStatus
            ? $booking->status
            : BookingStatus::tryFrom((string) $booking->status);

        return $status === BookingStatus::WAITING_PAYMENT_APPROVAL;
    }
}
