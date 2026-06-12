<?php

use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\TourCategory;
use App\Models\User;
use App\Policies\TourCategoryPolicy;
use Database\Seeders\Common\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->policy = new TourCategoryPolicy;
});

test('company team member with tour category permissions can mutate categories', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();

    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
    ]);

    $user->addRoles([
        'user:vendor',
        "company:{$company->id}:superadmin",
    ], "company:{$company->id}");

    $category = TourCategory::factory()->create([
        'company_id' => $company->id,
    ]);

    expect($this->policy->view($user, $category))->toBeTrue()
        ->and($this->policy->update($user, $category))->toBeTrue()
        ->and($this->policy->delete($user, $category))->toBeTrue()
        ->and($this->policy->create($user))->toBeTrue();
});

test('users outside the company team cannot mutate categories', function () {
    $member = User::factory()->create();
    $outsider = User::factory()->create();
    $company = Company::factory()->create();

    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $member->id,
    ]);

    $member->addRoles([
        'user:vendor',
        "company:{$company->id}:superadmin",
    ], "company:{$company->id}");

    $category = TourCategory::factory()->create([
        'company_id' => $company->id,
    ]);

    expect($this->policy->view($outsider, $category))->toBeFalse()
        ->and($this->policy->update($outsider, $category))->toBeFalse();
});

test('platform admin can manage any tour category', function () {
    $admin = User::factory()->create();
    $admin->addRole('user:admin');

    $category = TourCategory::factory()->create();

    expect($this->policy->view($admin, $category))->toBeTrue()
        ->and($this->policy->update($admin, $category))->toBeTrue();
});
