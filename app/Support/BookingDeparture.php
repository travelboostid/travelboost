<?php

namespace App\Support;

use App\Models\Booking;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

final class BookingDeparture
{
    /**
     * Whether the booking departure date is strictly before today.
     *
     * Departures scheduled for today remain manageable until the day ends,
     * matching reorder and reactivate behaviour elsewhere in the app.
     */
    public static function hasDeparted(Booking|string|CarbonInterface|null $departure): bool
    {
        $departureDate = self::resolveDepartureDate($departure);

        if ($departureDate === null) {
            return false;
        }

        return ! ($departureDate->isToday() || $departureDate->isFuture());
    }

    public static function hasDepartedBooking(Booking $booking): bool
    {
        return self::hasDeparted($booking->departure_date);
    }

    private static function resolveDepartureDate(Booking|string|CarbonInterface|null $departure): ?Carbon
    {
        if ($departure instanceof Booking) {
            $departure = $departure->departure_date;
        }

        if ($departure === null || $departure === '') {
            return null;
        }

        return Carbon::parse($departure)->startOfDay();
    }
}
