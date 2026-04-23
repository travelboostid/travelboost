<?php

namespace App\Services;

use App\Models\Company;

class BookingPricingService
{
    /**
     * All pricing constants - single source of truth.
     */
    public const PLATFORM_FEE_PER_PAX = 25_000; // IDR 25,000 per pax

    public const PPN_RATE = 0.11; // 11%

    /**
     * Calculate all pricing components for a booking.
     *
     * @param  array<int, array{price_amount: int}>  $guests
     * @return array{subtotalGuests: int, paxCount: int, platformFee: int, ppn: int, agentCommission: int, totalPrice: int, totalPayment: int}
     */
    public function calculate(array $guests, Company $vendor): array
    {
        $subtotalGuests = collect($guests)->sum('price_amount');
        $paxCount = count($guests);
        $platformFee = $paxCount * self::PLATFORM_FEE_PER_PAX;
        $ppn = (int) round($subtotalGuests * self::PPN_RATE);
        $agentCommission = (int) $vendor->commission; // fixed IDR, set by vendor

        $totalPrice = $subtotalGuests + $platformFee + $ppn + $agentCommission;
        $totalPayment = $totalPrice; // update here if discounts are added later

        return compact(
            'subtotalGuests',
            'paxCount',
            'platformFee',
            'ppn',
            'agentCommission',
            'totalPrice',
            'totalPayment'
        );
    }
}
