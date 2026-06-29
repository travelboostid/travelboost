<?php

use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use Illuminate\Support\Carbon;

/**
 * @param  array<string, mixed>  $overrides
 */
function createScheduledBooking(Company $vendor, Tour $tour, array $overrides = []): Booking
{
    $departureDate = $overrides['departure_date'] ?? now()->addDays(30)->toDateString();

    $schedule = TourSchedule::query()->firstOrCreate(
        [
            'tour_id' => $tour->id,
            'company_id' => $vendor->id,
            'departure_date' => $departureDate,
        ],
        [
            'tour_code' => $tour->code,
            'return_date' => Carbon::parse($departureDate)->addDays(5)->toDateString(),
            'is_active' => true,
        ],
    );

    TourAvailability::query()->firstOrCreate(
        [
            'company_id' => $vendor->id,
            'tour_id' => $tour->id,
            'schedule_id' => $schedule->id,
        ],
        [
            'max_pax' => 20,
            'available' => 20,
        ],
    );

    return Booking::factory()->create(array_merge([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
    ], $overrides));
}
