<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\TourSchedule;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class ReactivateBookingAction
{
    public function execute(Booking $booking): Booking
    {
        $booking->loadMissing(['vendor.companySetting', 'tour.company.companySetting', 'payments']);

        if ($this->bookingStatusValue($booking) !== BookingStatus::CANCELLED->value) {
            throw ValidationException::withMessages([
                'booking_action' => 'Only cancelled bookings can be reactivated.',
            ]);
        }

        if (! $this->hasBookableDeparture($booking)) {
            throw ValidationException::withMessages([
                'booking_action' => 'This booking departure is no longer available for reactivation.',
            ]);
        }

        if (! $this->hasSeatAvailability($booking)) {
            throw ValidationException::withMessages([
                'booking_action' => 'There are not enough seats available on this departure to reactivate the booking.',
            ]);
        }

        $targetStatus = $this->resolveTargetStatus($booking);

        $booking->update([
            'status' => $targetStatus,
            'reserved_expires_at' => null,
        ]);

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());

        return $booking->fresh();
    }

    public function canReactivate(Booking $booking): bool
    {
        if ($this->bookingStatusValue($booking) !== BookingStatus::CANCELLED->value) {
            return false;
        }

        return $this->hasBookableDeparture($booking) && $this->hasSeatAvailability($booking);
    }

    public function resolveTargetStatus(Booking $booking): BookingStatus
    {
        $booking->loadMissing('payments');

        $hasPaidFullPayment = $booking->payments
            ->contains(fn ($payment): bool => $payment->status === PaymentStatus::PAID
                && data_get($payment->payload, 'payment_type') === 'full_payment');

        if ($hasPaidFullPayment) {
            return BookingStatus::FULL_PAYMENT;
        }

        $hasPaidDownPayment = $booking->payments
            ->contains(fn ($payment): bool => $payment->status === PaymentStatus::PAID
                && data_get($payment->payload, 'payment_type') === 'down_payment');

        if ($hasPaidDownPayment) {
            return BookingStatus::DOWN_PAYMENT;
        }

        return BookingStatus::AWAITING_PAYMENT;
    }

    private function hasBookableDeparture(Booking $booking): bool
    {
        if (! $booking->departure_date || ! $booking->tour_id || ! $booking->vendor_id) {
            return false;
        }

        $departureDate = Carbon::parse($booking->departure_date);

        if (! ($departureDate->isToday() || $departureDate->isFuture())) {
            return false;
        }

        return $this->resolveSchedule($booking) !== null;
    }

    private function hasSeatAvailability(Booking $booking): bool
    {
        $schedule = $this->resolveSchedule($booking);

        if (! $schedule) {
            return false;
        }

        $schedule->loadMissing('availability');
        $availability = $schedule->availability;

        if (! $availability) {
            return false;
        }

        $requiredSeats = $this->requiredSeatCount($booking);

        return (int) $availability->available >= $requiredSeats;
    }

    private function resolveSchedule(Booking $booking): ?TourSchedule
    {
        if (! $this->isDepartureDateInsideBookingWindow($booking)) {
            return null;
        }

        return TourSchedule::query()
            ->where('tour_id', $booking->tour_id)
            ->where('company_id', $booking->vendor_id)
            ->where('is_active', true)
            ->whereDate('departure_date', Carbon::parse($booking->departure_date)->toDateString())
            ->first();
    }

    private function isDepartureDateInsideBookingWindow(Booking $booking): bool
    {
        $booking->loadMissing(['vendor.companySetting', 'tour.company.companySetting']);

        $deadlineDays = (int) (
            $booking->vendor?->companySetting?->booking_deadline
            ?? $booking->tour?->company?->companySetting?->booking_deadline
            ?? 0
        );

        return Carbon::parse($booking->departure_date)
            ->startOfDay()
            ->gte(now()->startOfDay()->addDays($deadlineDays));
    }

    private function requiredSeatCount(Booking $booking): int
    {
        return (int) ($booking->pax_adult ?? 0) + (int) ($booking->pax_child ?? 0);
    }

    private function bookingStatusValue(Booking $booking): string
    {
        $status = $booking->status;

        return $status instanceof BookingStatus ? $status->value : (string) $status;
    }
}
