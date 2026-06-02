<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\CompanySettings;
use App\Models\Tour;
use Illuminate\Validation\ValidationException;

class BookingDownPaymentRuleService
{
    public const MODE_GRAND_TOTAL_PERCENT = 'grand_total_percent';

    public const MODE_PER_PAX_PERCENT = 'per_pax_percent';

    /**
     * @return array{mode: string, percent: float}|null
     */
    public function resolveForSettings(?CompanySettings $settings): ?array
    {
        $grandTotalPercent = $this->positivePercent($settings?->minimum_down_payment);
        $perPaxPercent = $this->positivePercent($settings?->minimum_down_payment_value);

        if ($perPaxPercent !== null) {
            return [
                'mode' => self::MODE_PER_PAX_PERCENT,
                'percent' => $perPaxPercent,
            ];
        }

        if ($grandTotalPercent !== null) {
            return [
                'mode' => self::MODE_GRAND_TOTAL_PERCENT,
                'percent' => $grandTotalPercent,
            ];
        }

        return null;
    }

    /**
     * @return array{mode: string, percent: float}|null
     */
    public function resolveForTour(Tour $tour): ?array
    {
        $tour->loadMissing('company.companySetting');

        return $this->resolveForSettings($tour->company?->companySetting);
    }

    /**
     * @return array{mode: string, percent: float}|null
     */
    public function resolveForBooking(Booking $booking): ?array
    {
        $booking->loadMissing(['vendor.companySetting', 'tour.company.companySetting']);

        return $this->resolveForSettings(
            $booking->vendor?->companySetting ?? $booking->tour?->company?->companySetting
        );
    }

    public function assertPaymentTypeAvailableForTour(Tour $tour, string $paymentType): void
    {
        if ($paymentType !== 'down_payment' || $this->resolveForTour($tour) !== null) {
            return;
        }

        throw ValidationException::withMessages([
            'payment_type' => 'Down payment is unavailable for this tour. Please complete full payment.',
        ]);
    }

    public function assertPaymentTypeAvailableForBooking(Booking $booking, string $paymentType): void
    {
        if ($paymentType !== 'down_payment' || $this->resolveForBooking($booking) !== null) {
            return;
        }

        throw ValidationException::withMessages([
            'payment_type' => 'Down payment is unavailable for this tour. Please complete full payment.',
        ]);
    }

    public function assertIncomingDownPaymentAmount(Booking $booking, float $incomingAmount, string $paymentType): void
    {
        if ($paymentType !== 'down_payment') {
            return;
        }

        $minimumAmount = $this->minimumAmountForBooking($booking);

        if ($minimumAmount === null || $incomingAmount + 0.01 >= $minimumAmount) {
            return;
        }

        throw ValidationException::withMessages([
            'payment' => 'Down payment must cover the minimum down payment amount.',
        ]);
    }

    public function minimumAmountForBooking(Booking $booking): ?float
    {
        $rule = $this->resolveForBooking($booking);

        if ($rule === null) {
            return null;
        }

        if ($rule['mode'] === self::MODE_GRAND_TOTAL_PERCENT) {
            return (float) round((float) $booking->grand_total * ($rule['percent'] / 100));
        }

        $booking->loadMissing('passengers');

        return (float) round(
            $booking->passengers->sum(
                fn ($passenger): float => (float) $passenger->price_amount * ($rule['percent'] / 100)
            )
        );
    }

    private function positivePercent(mixed $value): ?float
    {
        if (! is_numeric($value) || (float) $value <= 0) {
            return null;
        }

        return (float) $value;
    }
}
