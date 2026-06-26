<?php

namespace App\Support;

use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

final class WaitingListSchedulePaxValidator
{
    /**
     * @param  array{pax_adult: int, pax_child: int, pax_infant: int}  $pax
     */
    public static function validateForWaitingList(
        Tour $tour,
        TourSchedule $schedule,
        TourAvailability $availability,
        array $pax,
        int $errorIndex,
        string $adultErrorKey = 'pax_adult',
    ): void {
        $requiredSeats = (int) $pax['pax_adult'] + (int) $pax['pax_child'];

        if ($requiredSeats < 1) {
            throw ValidationException::withMessages([
                "schedules.{$errorIndex}.{$adultErrorKey}" => 'At least one adult or child seat is required.',
            ]);
        }

        if (
            (int) $schedule->tour_id !== (int) $tour->id
            || (int) $schedule->company_id !== (int) $tour->company_id
            || ! $schedule->is_active
        ) {
            throw ValidationException::withMessages([
                "schedules.{$errorIndex}.id" => 'The selected departure schedule is unavailable.',
            ]);
        }

        $tour->loadMissing('company.companySetting');
        $bookingDeadlineDays = max(0, (int) ($tour->company?->companySetting?->booking_deadline ?? 0));
        $earliestBookableDeparture = now()->startOfDay()->addDays($bookingDeadlineDays);

        if (Carbon::parse($schedule->departure_date)->startOfDay()->lt($earliestBookableDeparture)) {
            throw ValidationException::withMessages([
                "schedules.{$errorIndex}.id" => 'The selected departure schedule has passed the booking deadline.',
            ]);
        }

        if ($requiredSeats <= (int) $availability->available) {
            throw ValidationException::withMessages([
                "schedules.{$errorIndex}.{$adultErrorKey}" => 'Seats are currently available for this passenger count. Please use Book Tour instead.',
            ]);
        }
    }
}
