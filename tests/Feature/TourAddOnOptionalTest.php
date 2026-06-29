<?php

use App\Enums\CompanyTeamStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Models\TourSchedule;
use App\Models\User;

test('vendor can clear all add-ons for a schedule', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['type' => 'vendor', 'username' => 'addonvendor']);
    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

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
        'price' => 100_000,
    ]);

    $response = $this->actingAs($user)->post(
        "/companies/{$company->username}/dashboard/tour-add-ons",
        [
            'add_ons' => [],
            'schedule_ids' => [$schedule->id],
        ],
    );

    $response->assertRedirect();

    expect(TourAddOn::query()->where('schedule_id', $schedule->id)->count())->toBe(0);
});
