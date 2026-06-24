<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\CompanySettings;
use App\Models\CompanyTeam;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->owner = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);

    $this->company = Company::factory()->create([
        'type' => CompanyType::AGENT,
        'username' => 'landing-page-agent',
    ]);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $this->owner->id,
        'invite_email' => $this->owner->email,
        'invite_role' => "company:{$this->company->id}:superadmin",
        'invited_at' => now(),
        'accepted_at' => now(),
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
    ]);

    $this->owner->addRoles([
        'user:agent',
        "company:{$this->company->id}:superadmin",
    ]);
});

test('edit landing page creates missing company settings before rendering', function () {
    CompanySettings::query()->where('company_id', $this->company->id)->delete();
    expect($this->company->fresh()->settings)->toBeNull();

    $response = $this->actingAs($this->owner)->get(
        route('companies.dashboard.page.edit', $this->company)
    );

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('companies/edit-landing-page')
        ->has('company.settings')
        ->where('company.settings.landing_page_data', null)
    );

    expect($this->company->fresh()->settings)->not->toBeNull();
});
