<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\CompanySettings;
use App\Models\Tour;
use Illuminate\Validation\ValidationException;

class BookingDownPaymentRuleService
{
    public const MODE_GRAND_TOTAL_PERCENT = 'grand_total_percent';

    public const MODE_PER_PAX_AMOUNT = 'per_pax_amount';

    /**
     * @return array{mode: string, percent?: float, amount?: float}|null
     */
    public function resolveForSettings(?CompanySettings $settings): ?array
    {
        $grandTotalPercent = $this->positivePercent($settings?->minimum_down_payment);
        $perPaxAmount = $this->positiveAmount($settings?->minimum_down_payment_value);

        if ($perPaxAmount !== null) {
            return [
                'mode' => self::MODE_PER_PAX_AMOUNT,
                'amount' => $perPaxAmount,
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
     * @return array{mode: string, percent?: float, amount?: float}|null
     */
    public function resolveForTour(Tour $tour): ?array
    {
        $tour->loadMissing('company.companySetting');

        return $this->resolveForSettings($tour->company?->companySetting);
    }

    /**
     * @return array{mode: string, percent?: float, amount?: float}|null
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
            return (float) round((float) $booking->grand_total * ((float) $rule['percent'] / 100));
        }

        $booking->loadMissing('passengers');
        $paxCount = $booking->passengers->count();

        if ($paxCount === 0) {
            $paxCount = (int) $booking->pax_adult + (int) $booking->pax_child + (int) $booking->pax_infant;
        }

        return (float) round($paxCount * (float) $rule['amount']);
    }

    private function positivePercent(mixed $value): ?float
    {
        if (! is_numeric($value) || (float) $value <= 0 || (float) $value > 100) {
            return null;
        }

        return (float) $value;
    }

    private function positiveAmount(mixed $value): ?float
    {
        if (! is_numeric($value) || (float) $value <= 0) {
            return null;
        }

        return (float) $value;
    }
}
