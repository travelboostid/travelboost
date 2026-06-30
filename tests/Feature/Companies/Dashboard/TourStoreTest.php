<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\TourStatus;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\ProductCommissionCategory;
use App\Models\Tour;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;

test('vendor can store a new inactive tour from dashboard', function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);
    $company = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'storetourvendor',
    ]);
    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'invite_email' => $user->email,
        'invite_role' => "company:{$company->id}:superadmin",
        'invited_at' => now(),
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    $user->addRoles([
        'user:vendor',
        "company:{$company->id}:superadmin",
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
