<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Models\TourSchedule;
use App\Models\User;
use App\Services\BookingAddOnOptionsService;

test('booking add on options default to zero quantity when resuming an existing booking', function () {
    $company = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $company->id]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);

    TourAddOn::factory()->create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'description' => 'Travel Insurance',
        'price' => 250_000,
        'edit_status' => false,
        'is_taxable' => true,
    ]);

    $booking = Booking::factory()->create([
        'user_id' => User::factory()->create()->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
    ]);

    $options = app(BookingAddOnOptionsService::class)->forSchedule($tour, $schedule, $booking);

    expect($options)->toHaveCount(1)
        ->and($options[0]['qty'])->toBe(0);
});

test('booking add on options keep default quantity for new bookings', function () {
    $company = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $company->id]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);

    TourAddOn::factory()->create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'description' => 'Travel Insurance',
        'price' => 250_000,
        'edit_status' => false,
        'is_taxable' => true,
    ]);

    $options = app(BookingAddOnOptionsService::class)->forSchedule($tour, $schedule);

    expect($options)->toHaveCount(1)
        ->and($options[0]['qty'])->toBe(1);
});
