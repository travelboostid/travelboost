<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Company;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpireBookingReservationsAction
{
    public function execute(?Company $company = null, ?int $tourId = null): int
    {
        $query = Booking::query()
            ->where('status', BookingStatus::BOOKING_RESERVED)
            ->where('reserved_type', 'system')
            ->whereNotNull('reserved_expires_at')
            ->where('reserved_expires_at', '<=', now())
            ->when($tourId, fn ($query) => $query->where('tour_id', $tourId));

        if ($company) {
            $companyType = $company->type->value ?? $company->type;

            $query->when($companyType === 'vendor', fn ($query) => $query->where('vendor_id', $company->id))
                ->when($companyType === 'agent', fn ($query) => $query->where('agent_id', $company->id));
        }

        $expiredCount = 0;

        foreach ($query->pluck('id') as $bookingId) {
            $booking = $this->expireById((int) $bookingId);

            if ($booking) {
                app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
                $expiredCount++;
            }
        }

        return $expiredCount;
    }

    public function expireIfDue(Booking $booking): Booking
    {
        if (! $booking->reserved_expires_at || $booking->reserved_expires_at->isFuture()) {
            return $booking;
        }

        if ($booking->status !== BookingStatus::BOOKING_RESERVED || $booking->reserved_type !== 'system') {
            return $booking;
        }

        $expiredBooking = $this->expireById($booking->id);

        if ($expiredBooking) {
            app(SyncAvailabilityAction::class)->executeForBooking($expiredBooking->fresh());

            return $expiredBooking->fresh();
        }

        return $booking->fresh();
    }

    private function expireById(int $bookingId): ?Booking
    {
        return DB::transaction(function () use ($bookingId): ?Booking {
            $booking = Booking::query()
                ->where('id', $bookingId)
                ->where('status', BookingStatus::BOOKING_RESERVED)
                ->where('reserved_type', 'system')
                ->whereNotNull('reserved_expires_at')
                ->where('reserved_expires_at', '<=', now())
                ->lockForUpdate()
                ->first();

            if (! $booking) {
                return null;
            }

            $booking->update([
                'status' => BookingStatus::EXPIRED,
                'reserved_expires_at' => null,
            ]);

            Log::info('Booking reservation expired', [
                'booking_number' => $booking->booking_number,
                'tour_id' => $booking->tour_id,
                'pax_released' => $booking->pax_adult + $booking->pax_child + $booking->pax_infant,
            ]);

            return $booking;
        });
    }
}
