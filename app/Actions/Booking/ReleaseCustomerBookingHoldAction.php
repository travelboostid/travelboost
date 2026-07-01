<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\TourWaitingListSchedule;
use App\Models\User;
use App\Support\TenantCustomerGuard;
use Illuminate\Support\Facades\DB;

class ReleaseCustomerBookingHoldAction
{
    /**
     * @return array{booking: Booking, released: bool}
     */
    public function execute(User $user, Booking $booking, Company $company): array
    {
        TenantCustomerGuard::assertBookingAccessible($user, $booking, $company);

        $released = false;

        $booking = DB::transaction(function () use ($booking, &$released): Booking {
            $lockedBooking = Booking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (
                $lockedBooking->status === BookingStatus::BOOKING_RESERVED
                && $lockedBooking->reserved_type === 'system'
                && ! $this->isWaitingListOfferBooking($lockedBooking)
            ) {
                $lockedBooking->update([
                    'status' => BookingStatus::EXPIRED,
                    'reserved_expires_at' => null,
                ]);
                $released = true;
            }

            return $lockedBooking->fresh(['tour']);
        });

        if ($released) {
            app(SyncAvailabilityAction::class)->executeForBooking($booking);
        }

        return [
            'booking' => $booking,
            'released' => $released,
        ];
    }

    private function isWaitingListOfferBooking(Booking $booking): bool
    {
        if ($booking->reserved_type === 'waiting_list_offer') {
            return true;
        }

        return TourWaitingListSchedule::query()
            ->where('booking_id', $booking->id)
            ->exists();
    }
}
