<?php

namespace App\Services;

use App\Enums\VendorAgentPartnerStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanySettings;
use App\Models\Tour;
use App\Models\VendorAgentPartner;

class BookingPaymentReceiverService
{
    /**
     * @return array{
     *     payment_mode: string,
     *     receiver_type: string,
     *     receiver_company: Company|null,
     *     settings: CompanySettings|null,
     *     partnership: VendorAgentPartner|null
     * }
     */
    public function resolveForBooking(Booking $booking): array
    {
        $booking->loadMissing(['vendor.companySetting', 'agent.companySetting']);

        $partnership = $this->resolvePartnership(
            (int) $booking->vendor_id,
            $booking->agent_id ? (int) $booking->agent_id : null
        );
        $paymentMode = $this->normalizePaymentMode($partnership?->payment_mode);
        $receiverType = $paymentMode === 'agent' && $booking->agent ? 'agent' : 'vendor';
        $receiverCompany = $receiverType === 'agent' ? $booking->agent : $booking->vendor;

        $receiverCompany?->loadMissing('companySetting');

        return [
            'payment_mode' => $paymentMode,
            'receiver_type' => $receiverType,
            'receiver_company' => $receiverCompany,
            'settings' => $receiverCompany?->companySetting,
            'partnership' => $partnership,
        ];
    }

    /**
     * @return array{
     *     payment_mode: string,
     *     receiver_type: string,
     *     receiver_company: Company|null,
     *     settings: CompanySettings|null,
     *     partnership: VendorAgentPartner|null
     * }
     */
    public function resolveForTourAndTenant(Tour $tour, ?Company $tenant): array
    {
        $tour->loadMissing('company.companySetting');
        $vendor = $tour->company;
        $tenantType = $tenant?->type->value ?? $tenant?->type;
        $agent = $tenantType === 'agent' ? $tenant : null;

        $partnership = $vendor && $agent
            ? $this->resolvePartnership((int) $vendor->id, (int) $agent->id)
            : null;
        $paymentMode = $this->normalizePaymentMode($partnership?->payment_mode);
        $receiverType = $paymentMode === 'agent' && $agent ? 'agent' : 'vendor';
        $receiverCompany = $receiverType === 'agent' ? $agent : $vendor;

        $receiverCompany?->loadMissing('companySetting');

        return [
            'payment_mode' => $paymentMode,
            'receiver_type' => $receiverType,
            'receiver_company' => $receiverCompany,
            'settings' => $receiverCompany?->companySetting,
            'partnership' => $partnership,
        ];
    }

    public function companyCanReviewManualPayment(Company $company, Booking $booking): bool
    {
        $receiverCompany = $this->resolveForBooking($booking)['receiver_company'];

        return $receiverCompany !== null && (int) $receiverCompany->id === (int) $company->id;
    }

    private function resolvePartnership(int $vendorId, ?int $agentId): ?VendorAgentPartner
    {
        if (! $agentId) {
            return null;
        }

        return VendorAgentPartner::query()
            ->where('vendor_id', $vendorId)
            ->where('agent_id', $agentId)
            ->where('status', VendorAgentPartnerStatus::ACTIVE->value)
            ->first();
    }

    private function normalizePaymentMode(?string $paymentMode): string
    {
        return in_array($paymentMode, ['vendor', 'agent'], true)
            ? $paymentMode
            : 'vendor';
    }
}
