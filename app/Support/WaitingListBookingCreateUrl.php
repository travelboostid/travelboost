<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\TourWaitingListSchedule;

class WaitingListBookingCreateUrl
{
    public static function fromOffer(
        Booking $booking,
        TourWaitingListSchedule $schedule,
        bool $absolute = false,
    ): ?string {
        $booking->loadMissing(['agent:id,username', 'vendor:id,username', 'tour:id']);
        $schedule->loadMissing([
            'tourSchedule:id,departure_date',
            'waitingList.tour.company:id,username',
        ]);

        $tour = $booking->tour ?? $schedule->waitingList?->tour;
        $tenantUsername = $booking->agent?->username
            ?? $booking->vendor?->username
            ?? $tour?->company?->username;

        if (! $tenantUsername || ! $tour) {
            return null;
        }

        $departureDate = $schedule->tourSchedule?->departure_date ?? $booking->departure_date;
        $date = $departureDate instanceof \DateTimeInterface
            ? $departureDate->format('Y-m-d')
            : (string) $departureDate;

        if ($date === '') {
            return null;
        }

        return route('bookings.create', [
            'username' => $tenantUsername,
            'tour' => $tour,
            'date' => $date,
            'booking_number' => $booking->booking_number,
            'waiting_list_schedule_id' => $schedule->id,
        ], $absolute);
    }
}
