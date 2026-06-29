<?php

namespace App\Actions\Booking;

use App\Enums\BookingAvailabilityContext;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Support\BookingAvailabilityMessages;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AssertScheduleSeatAvailabilityAction
{
    public function assertForBooking(Booking $booking, BookingAvailabilityContext $context = BookingAvailabilityContext::Finalization): void
    {
        if (! $booking->tour_id || ! $booking->vendor_id || ! $booking->departure_date) {
            if ($context === BookingAvailabilityContext::Reserve) {
                return;
            }

            $this->throwMissingSchedule($context);

            return;
        }

        $requiredSeats = $booking->seatTakingPaxCount();

        if ($requiredSeats <= 0) {
            return;
        }

        $departureDate = $booking->departure_date instanceof \DateTimeInterface
            ? $booking->departure_date->format('Y-m-d')
            : (string) $booking->departure_date;

        if ($context === BookingAvailabilityContext::Finalization) {
            $this->assertFinalizationAllowed(
                $booking,
                (int) $booking->tour_id,
                (int) $booking->vendor_id,
                $departureDate,
                $context,
            );

            return;
        }

        $this->assertForSchedule(
            tourId: (int) $booking->tour_id,
            companyId: (int) $booking->vendor_id,
            departureDate: $departureDate,
            requiredSeats: $requiredSeats,
            exceptBookingId: (int) $booking->id,
            context: $context,
        );
    }

    public function assertForSchedule(
        int $tourId,
        int $companyId,
        string $departureDate,
        int $requiredSeats,
        ?int $exceptBookingId = null,
        BookingAvailabilityContext $context = BookingAvailabilityContext::Reserve,
    ): void {
        if ($requiredSeats <= 0) {
            return;
        }

        DB::transaction(function () use ($tourId, $companyId, $departureDate, $requiredSeats, $exceptBookingId, $context): void {
            $availability = $this->lockAvailability($tourId, $companyId, $departureDate, $context);

            if (! $availability) {
                $this->throwMissingSchedule($context);

                return;
            }

            $this->assertWithLockedAvailability(
                $availability,
                $tourId,
                $companyId,
                $departureDate,
                $requiredSeats,
                $exceptBookingId,
                $context,
            );
        });
    }

    public function assertWithLockedAvailability(
        TourAvailability $availability,
        int $tourId,
        int $companyId,
        string $departureDate,
        int $requiredSeats,
        ?int $exceptBookingId,
        BookingAvailabilityContext $context,
    ): void {
        $occupiedSeats = $this->occupiedSeatCount($tourId, $companyId, $departureDate, $exceptBookingId);
        $freeSeats = max(0, (int) $availability->max_pax - $occupiedSeats);

        if ($requiredSeats > $freeSeats) {
            throw ValidationException::withMessages([
                $context->validationField() => $context->message($freeSeats),
            ]);
        }
    }

    public function occupiedSeatCount(
        int $tourId,
        int $companyId,
        string $departureDate,
        ?int $exceptBookingId = null,
    ): int {
        return (int) Booking::query()
            ->where('tour_id', $tourId)
            ->where('vendor_id', $companyId)
            ->whereDate('departure_date', $departureDate)
            ->whereIn('status', BookingStatus::reducingAvailabilityValues())
            ->when($exceptBookingId, fn ($query) => $query->where('id', '!=', $exceptBookingId))
            ->selectRaw('COALESCE(SUM(COALESCE(pax_adult, 0) + COALESCE(pax_child, 0)), 0) as total_pax')
            ->value('total_pax');
    }

    private function assertFinalizationAllowed(
        Booking $booking,
        int $tourId,
        int $companyId,
        string $departureDate,
        BookingAvailabilityContext $context,
    ): void {
        DB::transaction(function () use ($booking, $tourId, $companyId, $departureDate, $context): void {
            $availability = $this->lockAvailability($tourId, $companyId, $departureDate, $context);

            if (! $availability) {
                $this->throwMissingSchedule($context);

                return;
            }

            $allowedBookingIds = $this->allowedBookingIdsBySeatPriority(
                $tourId,
                $companyId,
                $departureDate,
                (int) $availability->max_pax,
            );

            if (in_array((int) $booking->id, $allowedBookingIds, true)) {
                return;
            }

            $requiredSeats = $booking->seatTakingPaxCount();
            $occupiedSeats = $this->occupiedSeatCount(
                $tourId,
                $companyId,
                $departureDate,
                (int) $booking->id,
            );
            $freeSeats = max(0, (int) $availability->max_pax - $occupiedSeats);

            if ($requiredSeats <= 0 || $requiredSeats <= $freeSeats) {
                return;
            }

            throw ValidationException::withMessages([
                $context->validationField() => $context->message(),
            ]);
        });
    }

    /**
     * @return list<int>
     */
    private function allowedBookingIdsBySeatPriority(
        int $tourId,
        int $companyId,
        string $departureDate,
        int $maxPax,
    ): array {
        /** @var Collection<int, Booking> $bookings */
        $bookings = Booking::query()
            ->where('tour_id', $tourId)
            ->where('vendor_id', $companyId)
            ->whereDate('departure_date', $departureDate)
            ->whereIn('status', BookingStatus::reducingAvailabilityValues())
            ->with(['payments' => fn ($query) => $query->where('status', 'paid')->orderBy('paid_at')])
            ->get()
            ->sortBy(fn (Booking $candidate): array => [
                $this->bookingSeatPriorityTimestamp($candidate),
                (int) $candidate->id,
            ])
            ->values();

        $remainingSeats = $maxPax;
        $allowedBookingIds = [];

        foreach ($bookings as $candidate) {
            $requiredSeats = $candidate->seatTakingPaxCount();

            if ($requiredSeats <= $remainingSeats) {
                $remainingSeats -= $requiredSeats;
                $allowedBookingIds[] = (int) $candidate->id;
            }
        }

        return $allowedBookingIds;
    }

    private function bookingSeatPriorityTimestamp(Booking $booking): string
    {
        $paidPayments = $booking->payments
            ->filter(fn ($payment): bool => $payment->paid_at !== null || $payment->status === 'paid');

        if ($paidPayments->isNotEmpty()) {
            $earliestPaidPayment = $paidPayments
                ->sortBy(fn ($payment): string => ($payment->paid_at ?? $payment->created_at)->format('Y-m-d H:i:s.u'))
                ->first();

            return ($earliestPaidPayment->paid_at ?? $earliestPaidPayment->created_at)->format('Y-m-d H:i:s.u');
        }

        return ($booking->created_at ?? now())->format('Y-m-d H:i:s.u');
    }

    private function throwMissingSchedule(BookingAvailabilityContext $context): void
    {
        throw ValidationException::withMessages([
            $context->validationField() => BookingAvailabilityMessages::missingSchedule(),
        ]);
    }

    private function lockAvailability(
        int $tourId,
        int $companyId,
        string $departureDate,
        BookingAvailabilityContext $context,
    ): ?TourAvailability {
        $schedule = TourSchedule::query()
            ->where('tour_id', $tourId)
            ->where('company_id', $companyId)
            ->whereDate('departure_date', $departureDate)
            ->orderBy('id')
            ->first();

        if (! $schedule) {
            return null;
        }

        return TourAvailability::query()
            ->where('company_id', $companyId)
            ->where('tour_id', $tourId)
            ->where('schedule_id', $schedule->id)
            ->lockForUpdate()
            ->first();
    }
}
