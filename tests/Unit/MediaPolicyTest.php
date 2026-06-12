<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\MediaType;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Media;
use App\Models\User;
use App\Policies\MediaPolicy;
use Database\Seeders\Common\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->policy = new MediaPolicy;
});

test('user can manage their own user-owned media without company permissions', function () {
    $user = User::factory()->create();

    $media = Media::create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'name' => 'Profile photo',
        'type' => MediaType::IMAGE,
        'subtype' => 'photo',
        'data' => [],
    ]);

    expect($this->policy->view($user, $media))->toBeTrue()
        ->and($this->policy->update($user, $media))->toBeTrue()
        ->and($this->policy->delete($user, $media))->toBeTrue()
        ->and($this->policy->createForOwner($user, 'user', $user->id))->toBeTrue();
});

test('company team member with media permissions can manage company media', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();

    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $user->addRoles([
        'user:vendor',
        "company:{$company->id}:superadmin",
    ], "company:{$company->id}");

    $media = Media::create([
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'name' => 'Tour brochure',
        'type' => MediaType::DOCUMENT,
        'subtype' => 'tour-document',
        'data' => [],
    ]);

    expect($this->policy->view($user, $media))->toBeTrue()
        ->and($this->policy->update($user, $media))->toBeTrue()
        ->and($this->policy->createForOwner($user, 'company', $company->id))->toBeTrue()
        ->and($this->policy->viewOwnerMedia($user, 'company', $company->id))->toBeTrue();
});

test('other users cannot access company media', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $company = Company::factory()->create();

    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $owner->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $owner->addRoles([
        'user:vendor',
        "company:{$company->id}:superadmin",
    ], "company:{$company->id}");

    $media = Media::create([
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'name' => 'Private doc',
        'type' => MediaType::DOCUMENT,
        'subtype' => 'tour-document',
        'data' => [],
    ]);

    expect($this->policy->view($intruder, $media))->toBeFalse()
        ->and($this->policy->update($intruder, $media))->toBeFalse()
        ->and($this->policy->createForOwner($intruder, 'company', $company->id))->toBeFalse();
});

test('platform admin can access any media', function () {
    $admin = User::factory()->create();
    $admin->addRole('user:admin');

    $company = Company::factory()->create();
    $media = Media::create([
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'name' => 'Admin visible',
        'type' => MediaType::RAW,
        'subtype' => 'other',
        'data' => [],
    ]);

    expect($this->policy->view($admin, $media))->toBeTrue()
        ->and($this->policy->update($admin, $media))->toBeTrue()
        ->and($this->policy->createForOwner($admin, 'company', $company->id))->toBeTrue();
});
