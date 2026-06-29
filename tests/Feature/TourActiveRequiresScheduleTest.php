<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\TourStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Tour;
use App\Models\TourSchedule;
use App\Models\User;

test('vendor cannot activate tour without departure schedules', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['type' => 'vendor', 'username' => 'schedvendor']);
    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => TourStatus::INACTIVE,
    ]);

    $response = $this->actingAs($user)->patch(
        route('companies.dashboard.tours.update', [
            'company' => $company->username,
            'tour' => $tour->id,
        ]),
        [
            'quick_update' => true,
            'status' => TourStatus::ACTIVE->value,
        ],
    );

    $response->assertSessionHasErrors('status');
    expect($tour->fresh()->status)->toBe(TourStatus::INACTIVE);
});

test('vendor can activate tour when at least one schedule exists', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['type' => 'vendor', 'username' => 'schedvendor2']);
    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => TourStatus::INACTIVE,
    ]);

    TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->patch(
        route('companies.dashboard.tours.update', [
            'company' => $company->username,
            'tour' => $tour->id,
        ]),
        [
            'quick_update' => true,
            'status' => TourStatus::ACTIVE->value,
        ],
    );

    $response->assertRedirect();
    expect($tour->fresh()->status)->toBe(TourStatus::ACTIVE);
});
