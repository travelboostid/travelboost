<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TourSchedule;
use App\Services\BookingPricingService;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class RescheduleBookingAction
{
    public function execute(Booking $booking, TourSchedule $targetSchedule): Booking
    {
        $booking->loadMissing(['vendor.companySetting', 'tour.company.companySetting']);

        $currentStatus = $this->bookingStatusValue($booking);

        if (! in_array($currentStatus, [
            BookingStatus::DOWN_PAYMENT->value,
            BookingStatus::FULL_PAYMENT->value,
        ], true)) {
            throw ValidationException::withMessages([
                'booking_action' => 'Only down payment or full payment bookings can be rescheduled.',
            ]);
        }

        $targetDeparture = Carbon::parse($targetSchedule->departure_date)->toDateString();
        $currentDeparture = Carbon::parse($booking->departure_date)->toDateString();

        if ($targetDeparture === $currentDeparture) {
            throw ValidationException::withMessages([
                'schedule_id' => 'Please choose a different departure date.',
            ]);
        }

        if ((int) $targetSchedule->tour_id !== (int) $booking->tour_id
            || (int) $targetSchedule->company_id !== (int) $booking->vendor_id
            || ! $targetSchedule->is_active) {
            throw ValidationException::withMessages([
                'schedule_id' => 'The selected schedule is not valid for this booking.',
            ]);
        }

        if (! $this->isDepartureDateInsideBookingWindow($booking, $targetDeparture)) {
            throw ValidationException::withMessages([
                'schedule_id' => 'The selected departure is outside the booking window.',
            ]);
        }

        if (! $this->hasSeatAvailability($booking, $targetSchedule)) {
            throw ValidationException::withMessages([
                'schedule_id' => 'There are not enough seats available on the selected departure.',
            ]);
        }

        $previousDeparture = $currentDeparture;
        $priceBefore = (float) $booking->grand_total;

        $booking->update([
            'departure_date' => $targetDeparture,
        ]);

        $booking = $this->repriceBookingForSchedule($booking->fresh(), $targetSchedule);
        $booking = app(ReconcileBookingPaymentAfterRepriceAction::class)->execute($booking, $priceBefore);

        app(SyncAvailabilityAction::class)->execute(
            (int) $booking->tour_id,
            $previousDeparture,
            (int) $booking->vendor_id,
        );
        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());

        return $booking->fresh();
    }

    public function canReschedule(Booking $booking): bool
    {
        $currentStatus = $this->bookingStatusValue($booking);

        if (! in_array($currentStatus, [
            BookingStatus::DOWN_PAYMENT->value,
            BookingStatus::FULL_PAYMENT->value,
        ], true)) {
            return false;
        }

        return $booking->tour_id !== null
            && $booking->vendor_id !== null
            && $booking->departure_date !== null;
    }

    /**
     * @return array{grand_total: float, price_difference: float}
     */
    public function previewPricingChange(Booking $booking, TourSchedule $targetSchedule): array
    {
        $booking->loadMissing(['passengers', 'addons', 'vendor.companySetting', 'tour.company.companySetting', 'tour']);

        $priceBefore = (float) $booking->grand_total;
        $quote = $this->buildScheduleQuote($booking, $targetSchedule);

        if ($quote === null) {
            return [
                'grand_total' => $priceBefore,
                'price_difference' => 0.0,
            ];
        }

        $priceAfter = (float) ($quote['grand_total'] ?? $priceBefore);

        return [
            'grand_total' => $priceAfter,
            'price_difference' => round($priceAfter - $priceBefore, 2),
        ];
    }

    private function repriceBookingForSchedule(Booking $booking, TourSchedule $targetSchedule): Booking
    {
        $quote = $this->buildScheduleQuote($booking, $targetSchedule);

        if ($quote === null) {
            return $booking;
        }

        $totals = app(BookingPricingService::class)->bookingTotalsFromQuote($quote);

        $booking->update($totals);

        $booking->loadMissing('passengers');

        foreach ($booking->passengers->values() as $index => $passenger) {
            $quotedPassenger = $quote['passengers'][$index] ?? null;

            if (! is_array($quotedPassenger)) {
                continue;
            }

            $passenger->update([
                'price_amount' => $quotedPassenger['price_amount'],
                'visa_category_item_id' => $quotedPassenger['visa_category_item_id'] ?? null,
                'visa_type_description' => $quotedPassenger['visa_type_description'] ?? null,
                'visa_type_price' => $quotedPassenger['visa_type_price'] ?? 0,
                'visa_type_is_taxable' => (bool) ($quotedPassenger['visa_type_is_taxable'] ?? false),
            ]);
        }

        $booking->addons()->delete();

        if (! empty($quote['addons'])) {
            $booking->addons()->createMany($quote['addons']);
        }

        return $booking->fresh();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function buildScheduleQuote(Booking $booking, TourSchedule $targetSchedule): ?array
    {
        $booking->loadMissing(['passengers', 'addons', 'vendor.companySetting', 'tour.company.companySetting', 'tour']);

        if (! $booking->tour || $booking->passengers->isEmpty()) {
            return null;
        }

        $passengers = $booking->passengers
            ->map(fn ($passenger): array => [
                'price_category' => (string) $passenger->price_category,
                'visa_category_item_id' => $passenger->visa_category_item_id,
            ])
            ->values()
            ->all();

        $addons = $booking->addons
            ->map(fn ($addon): array => [
                'name' => (string) $addon->name,
                'price' => (float) $addon->price,
                'is_taxable' => (bool) $addon->is_taxable,
                'qty' => 1,
            ])
            ->values()
            ->all();

        return app(BookingPricingService::class)->quoteForBookingData(
            $booking->tour,
            $targetSchedule->departure_date,
            $passengers,
            $addons,
            $booking->tax_rate !== null ? (float) $booking->tax_rate : null,
            includeAgentCommission: true,
            agentId: $booking->agent_id,
        );
    }

    private function hasSeatAvailability(Booking $booking, TourSchedule $targetSchedule): bool
    {
        $targetSchedule->loadMissing('availability');
        $availability = $targetSchedule->availability;

        if (! $availability) {
            return false;
        }

        $requiredSeats = (int) ($booking->pax_adult ?? 0) + (int) ($booking->pax_child ?? 0);

        return (int) $availability->available >= $requiredSeats;
    }

    private function isDepartureDateInsideBookingWindow(Booking $booking, string $departureDate): bool
    {
        $booking->loadMissing(['vendor.companySetting', 'tour.company.companySetting']);

        $deadlineDays = (int) (
            $booking->vendor?->companySetting?->booking_deadline
            ?? $booking->tour?->company?->companySetting?->booking_deadline
            ?? 0
        );

        return Carbon::parse($departureDate)
            ->startOfDay()
            ->gte(now()->startOfDay()->addDays($deadlineDays));
    }

    private function bookingStatusValue(Booking $booking): string
    {
        $status = $booking->status;

        return $status instanceof BookingStatus ? $status->value : (string) $status;
    }
}
