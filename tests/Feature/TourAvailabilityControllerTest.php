<?php

use App\Enums\CompanyTeamStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourCategory;
use App\Models\TourSchedule;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    $this->user = User::factory()->create();
});

test('availability save stores scheduled manual reserved times in utc based on the submitted timezone', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $category = TourCategory::factory()->forCompany($vendor)->create([
        'manual_reserved_limit_value' => 30,
        'manual_reserved_limit_unit' => 'minute',
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'category_id' => $category->id,
    ]);

    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => '2026-06-09',
        'return_date' => '2026-06-14',
        'quota' => 24,
        'is_active' => true,
    ]);

    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 24,
        'available' => 24,
        'RS' => 0,
    ]);

    $response = $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/tour-availabilities", [
            'availabilities' => [[
                'tour_id' => $tour->id,
                'schedule_id' => $schedule->id,
                'max_pax' => 24,
                'RS' => 2,
                'available' => 24,
                'manual_reserved_start_date' => '2026-06-09',
                'manual_reserved_start_time' => '21:00',
                'manual_reserved_timezone' => 'Asia/Jakarta',
            ]],
        ]);

    $response->assertRedirect();

    $availability = TourAvailability::query()
        ->where('schedule_id', $schedule->id)
        ->firstOrFail();

    expect((int) $availability->RS)->toBe(0)
        ->and((int) $availability->manual_reserved_pending_value)->toBe(2)
        ->and((int) $availability->available)->toBe(24)
        ->and($availability->manual_reserved_original_available)->toBeNull()
        ->and($availability->manual_reserved_started_at?->utc()->format('Y-m-d H:i:s'))
        ->toBe('2026-06-09 14:00:00')
        ->and($availability->manual_reserved_expires_at?->utc()->format('Y-m-d H:i:s'))
        ->toBe('2026-06-09 14:30:00');
});

test('availability save keeps manual reserved without expiry when the tour has no category', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'category_id' => null,
    ]);

    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => '2026-06-09',
        'return_date' => '2026-06-14',
        'quota' => 24,
        'is_active' => true,
    ]);

    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 24,
        'available' => 24,
        'RS' => 0,
    ]);

    $response = $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/tour-availabilities", [
            'availabilities' => [[
                'tour_id' => $tour->id,
                'schedule_id' => $schedule->id,
                'max_pax' => 24,
                'RS' => 2,
                'available' => 24,
                'manual_reserved_start_date' => '2026-06-09',
                'manual_reserved_start_time' => '21:00',
                'manual_reserved_timezone' => 'Asia/Jakarta',
            ]],
        ]);

    $response->assertRedirect();

    $availability = TourAvailability::query()
        ->where('schedule_id', $schedule->id)
        ->firstOrFail();

    expect((int) $availability->RS)->toBe(0)
        ->and((int) $availability->manual_reserved_pending_value)->toBe(2)
        ->and((int) $availability->available)->toBe(24)
        ->and($availability->manual_reserved_started_at?->utc()->format('Y-m-d H:i:s'))
        ->toBe('2026-06-09 14:00:00')
        ->and($availability->manual_reserved_expires_at)->toBeNull();
});
