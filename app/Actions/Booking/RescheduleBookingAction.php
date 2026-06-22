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

        $booking->update([
            'departure_date' => $targetDeparture,
        ]);

        $booking = app(BookingPricingService::class)->reconcileSnapshotTotals($booking->fresh());

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
        $booking->loadMissing(['passengers', 'addons', 'vendor.companySetting', 'tour.company.companySetting']);

        $priceBefore = (float) $booking->grand_total;
        $previewBooking = $booking->replicate();
        $previewBooking->departure_date = Carbon::parse($targetSchedule->departure_date)->toDateString();
        $previewBooking->exists = true;
        $previewBooking->id = $booking->id;
        $previewBooking->setRelation('passengers', $booking->passengers);
        $previewBooking->setRelation('addons', $booking->addons);
        $previewBooking->setRelation('vendor', $booking->vendor);
        $previewBooking->setRelation('tour', $booking->tour);

        $quote = app(BookingPricingService::class)->quoteForBooking($previewBooking);
        $priceAfter = (float) ($quote['grand_total'] ?? $priceBefore);

        return [
            'grand_total' => $priceAfter,
            'price_difference' => round($priceAfter - $priceBefore, 2),
        ];
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
