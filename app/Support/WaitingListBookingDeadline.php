<?php

namespace App\Support;

use App\Models\Tour;
use App\Models\TourSchedule;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

final class WaitingListBookingDeadline
{
    public static function earliestBookableDeparture(Tour $tour): CarbonInterface
    {
        $tour->loadMissing('company.companySetting');
        $bookingDeadlineDays = max(0, (int) ($tour->company?->companySetting?->booking_deadline ?? 0));

        return now()->startOfDay()->addDays($bookingDeadlineDays);
    }

    public static function isPastDeadline(TourSchedule $schedule, Tour $tour): bool
    {
        return Carbon::parse($schedule->departure_date)
            ->startOfDay()
            ->lt(self::earliestBookableDeparture($tour));
    }
}
