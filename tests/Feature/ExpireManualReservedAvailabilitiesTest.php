<?php

use App\Models\Company;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;

test('it releases expired manual reserved availability rows', function () {
    $originalTimezone = date_default_timezone_get();
    date_default_timezone_set('Asia/Jakarta');

    try {
        $expiredStartedAt = now('UTC')->subHour();
        $expiredAt = now('UTC')->subMinute();
        $futureStartedAt = now('UTC');
        $futureAt = now('UTC')->addHour();

        $company = Company::factory()->create(['type' => 'vendor']);
        $tour = Tour::factory()->create(['company_id' => $company->id]);
        $schedule = TourSchedule::create([
            'tour_id' => $tour->id,
            'tour_code' => $tour->code,
            'company_id' => $company->id,
            'departure_date' => now()->addMonth()->toDateString(),
            'return_date' => now()->addMonth()->addDays(5)->toDateString(),
            'quota' => 24,
            'is_active' => true,
        ]);
        $futureSchedule = TourSchedule::create([
            'tour_id' => $tour->id,
            'tour_code' => $tour->code,
            'company_id' => $company->id,
            'departure_date' => now()->addMonths(2)->toDateString(),
            'return_date' => now()->addMonths(2)->addDays(5)->toDateString(),
            'quota' => 24,
            'is_active' => true,
        ]);

        $expiredAvailability = TourAvailability::create([
            'company_id' => $company->id,
            'tour_id' => $tour->id,
            'schedule_id' => $schedule->id,
            'max_pax' => 24,
            'RS' => 2,
            'available' => 22,
            'manual_reserved_started_at' => $expiredStartedAt,
            'manual_reserved_expires_at' => $expiredAt,
            'manual_reserved_original_available' => 24,
        ]);
        $futureAvailability = TourAvailability::create([
            'company_id' => $company->id,
            'tour_id' => $tour->id,
            'schedule_id' => $futureSchedule->id,
            'max_pax' => 24,
            'RS' => 3,
            'available' => 21,
            'manual_reserved_started_at' => $futureStartedAt,
            'manual_reserved_expires_at' => $futureAt,
            'manual_reserved_original_available' => 24,
        ]);

        $this->artisan('tour-availabilities:expire-manual-reserved')
            ->assertSuccessful();

        expect($expiredAvailability->fresh())
            ->RS->toBe(0)
            ->available->toBe(24)
            ->manual_reserved_started_at->toBeNull()
            ->manual_reserved_expires_at->toBeNull()
            ->manual_reserved_original_available->toBeNull()
            ->and($company->fresh()->notifications()->count())
            ->toBe(1)
            ->and($company->fresh()->notifications()->latest()->first()->data)
            ->toMatchArray([
                'title' => 'Manual reserved expired',
                'type' => 'manual_reserved_expired',
                'tour_id' => $tour->id,
                'schedule_id' => $schedule->id,
                'released_seats' => 2,
            ])
            ->and($futureAvailability->fresh())
            ->RS->toBe(3)
            ->available->toBe(21)
            ->manual_reserved_started_at->not->toBeNull()
            ->manual_reserved_expires_at->not->toBeNull()
            ->manual_reserved_original_available->toBe(24);
    } finally {
        date_default_timezone_set($originalTimezone);
    }
});
