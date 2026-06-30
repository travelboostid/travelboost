<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\TourStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\ProductCommissionCategory;
use App\Models\Tour;
use App\Models\User;

test('vendor can store a new inactive tour from dashboard', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['type' => 'vendor', 'username' => 'storetourvendor']);
    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $commissionCategory = ProductCommissionCategory::create([
        'company_id' => $company->id,
        'category_name' => 'Group Tour',
        'slug' => 'group-tour',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->post(
        route('companies.dashboard.tours.store', [
            'company' => $company->username,
        ]),
        [
            'name' => 'Grand China Adventure',
            'description' => 'Sample tour description',
            'destination' => 'Beijing',
            'duration_days' => 7,
            'status' => TourStatus::INACTIVE->value,
            'product_commission_category_id' => $commissionCategory->id,
            'showprice' => '',
            'promote_price' => 0,
            'currency' => 'IDR',
        ],
    );

    $tour = Tour::query()
        ->where('company_id', $company->id)
        ->where('name', 'Grand China Adventure')
        ->first();

    expect($tour)->not->toBeNull()
        ->and($tour->status)->toBe(TourStatus::INACTIVE)
        ->and($tour->showprice)->toBe(0)
        ->and($tour->promote_price)->toBe(0);

    $response->assertRedirect(
        route('companies.dashboard.tours.edit', [
            'company' => $company->username,
            'tour' => $tour->id,
        ]),
    );
});
