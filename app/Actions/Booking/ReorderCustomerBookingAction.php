<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourSchedule;
use App\Models\User;
use App\Support\TenantCustomerGuard;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReorderCustomerBookingAction
{
    /**
     * @return array{booking: Booking, continue_url: string, reactivated: bool}
     */
    public function execute(User $user, Booking $booking, Company $company): array
    {
        TenantCustomerGuard::assertBookingAccessible($user, $booking, $company);

        $booking = app(ExpireBookingReservationsAction::class)->expireIfDue($booking);
        $booking->loadMissing(['agent', 'vendor', 'tour.company.companySetting']);

        $status = $booking->status instanceof BookingStatus
            ? $booking->status
            : BookingStatus::tryFrom((string) $booking->status);

        if (! in_array($status, [
            BookingStatus::EXPIRED,
            BookingStatus::AWAITING_PAYMENT,
            BookingStatus::BOOKING_RESERVED,
        ], true)) {
            throw ValidationException::withMessages([
                'booking' => 'This booking cannot be reordered.',
            ]);
        }

        if (! $booking->departure_date?->isToday() && ! $booking->departure_date?->isFuture()) {
            throw ValidationException::withMessages([
                'departure_date' => 'This departure date has passed.',
            ]);
        }

        $tour = $booking->tour;

        if (! $tour instanceof Tour || ! $this->resolveBookableSchedule(
            $tour,
            $booking->departure_date->toDateString(),
            $booking->vendor_id
        )) {
            throw ValidationException::withMessages([
                'departure_date' => 'Booking window closed.',
            ]);
        }

        $reactivated = false;

        if ($status === BookingStatus::EXPIRED) {
            DB::transaction(function () use ($booking): void {
                $booking->update([
                    'status' => BookingStatus::AWAITING_PAYMENT,
                    'reserved_type' => 'system',
                    'reserved_expires_at' => null,
                ]);
            });

            app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
            $reactivated = true;
        }

        $booking = $booking->fresh(['tour']);

        return [
            'booking' => $booking,
            'continue_url' => $this->buildContinueUrl($booking),
            'reactivated' => $reactivated,
        ];
    }

    private function buildContinueUrl(Booking $booking): string
    {
        $departureDate = $booking->departure_date instanceof \DateTimeInterface
            ? Carbon::instance($booking->departure_date)->toDateString()
            : Carbon::parse((string) $booking->departure_date)->toDateString();

        return '/bookings/'.$booking->tour_id.'/create'
            .'?date='.urlencode($departureDate)
            .'&booking_number='.urlencode((string) $booking->booking_number);
    }

    private function resolveBookableSchedule(Tour $tour, string $departureDate, ?int $companyId = null): ?TourSchedule
    {
        if (! $this->isDepartureDateInsideBookingWindow($tour, $departureDate)) {
            return null;
        }

        return TourSchedule::query()
            ->where('tour_id', $tour->id)
            ->where('company_id', $companyId ?? $tour->company_id)
            ->where('is_active', true)
            ->whereDate('departure_date', Carbon::parse($departureDate)->toDateString())
            ->first();
    }

    private function isDepartureDateInsideBookingWindow(Tour $tour, string $departureDate): bool
    {
        $tour->loadMissing('company.companySetting');

        $parsedDepartureDate = Carbon::parse($departureDate)->startOfDay();
        $deadlineDays = (int) ($tour->company?->companySetting?->booking_deadline ?? 0);
        $cutoffDate = now()->startOfDay()->addDays($deadlineDays);

        return $parsedDepartureDate->gte($cutoffDate);
    }
}
