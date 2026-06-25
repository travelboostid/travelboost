<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Role;
use App\Models\User;

test('graceful denial redirect for unauthorized inertia requests with company parameter', function () {
    $this->withoutVite();

    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $company = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'denial-test-company',
    ]);

    // First or create roles
    Role::firstOrCreate([
        'name' => 'user:vendor',
    ], [
        'display_name' => 'Vendor User',
    ]);
    Role::firstOrCreate([
        'name' => "company:{$company->id}:member",
    ], [
        'display_name' => 'Member',
    ]);

    // Add user to company team but without roles/permissions needed
    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'invite_email' => $user->email,
        'invite_role' => "company:{$company->id}:member",
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $user->addRoles(['user:vendor', "company:{$company->id}:member"]);

    // Retrieve active Inertia version dynamically
    $version = (new HandleInertiaRequests)->version(request());

    // Make an Inertia request to the roles listing, which checks role.query
    $response = $this->actingAs($user)
        ->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $version,
        ])
        ->get("/companies/{$company->username}/dashboard/roles");

    $response->assertRedirect(route('companies.dashboard.index', ['company' => $company->username]));
    $response->assertSessionHas('warning', 'Your role does not have permission to access this page.');
});

test('graceful denial redirect back if no company parameter can be resolved', function () {
    $this->withoutVite();

    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);

    // Retrieve active Inertia version dynamically
    $version = (new HandleInertiaRequests)->version(request());

    // Requesting an admin route which the user has no permissions for
    $response2 = $this->actingAs($user)
        ->from('/some-previous-url')
        ->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $version,
        ])
        ->get('/admin/database/roles');

    $response2->assertRedirect('/some-previous-url');
    $response2->assertSessionHas('warning', 'Your role does not have permission to access this page.');
});
