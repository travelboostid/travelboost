<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
});

function attachCompanyMember(User $user, Company $company, string $roleName, array $permissions = []): void
{
    $role = Role::query()->firstOrCreate(
        ['name' => $roleName],
        ['display_name' => str($roleName)->afterLast(':')->headline()],
    );

    if ($permissions !== []) {
        $role->syncPermissions(
            Permission::query()->whereIn('name', $permissions)->get(),
        );
    }

    CompanyTeam::query()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'invite_email' => $user->email,
        'invite_role' => $roleName,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $user->addRoles([
        $company->type === CompanyType::VENDOR ? 'user:vendor' : 'user:agent',
        $roleName,
    ], "company:{$company->id}");
}

test('customers index requires customers query permission', function () {
    $company = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'rbac-sync-vendor',
    ]);
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);

    attachCompanyMember($user, $company, "company:{$company->id}:staff");

    $this->actingAs($user)
        ->get("/companies/{$company->username}/dashboard/customers")
        ->assertForbidden();

    $role = Role::query()->where('name', "company:{$company->id}:staff")->firstOrFail();
    $role->syncPermissions([
        Permission::query()->where('name', 'customers.query')->firstOrFail(),
    ]);

    $this->actingAs($user)
        ->get("/companies/{$company->username}/dashboard/customers")
        ->assertOk();
});

test('vendor only routes reject agent companies even with broad permissions', function () {
    $company = Company::factory()->create([
        'type' => CompanyType::AGENT,
        'username' => 'rbac-sync-agent',
    ]);
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);

    attachCompanyMember(
        $user,
        $company,
        "company:{$company->id}:manager",
        ['agents.query', 'agents.mutation'],
    );

    $this->actingAs($user)
        ->get("/companies/{$company->username}/dashboard/agent-registrations")
        ->assertForbidden();
});

test('agent only routes reject vendor companies even with broad permissions', function () {
    $company = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'rbac-sync-vendor-only',
    ]);
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);

    attachCompanyMember(
        $user,
        $company,
        "company:{$company->id}:manager",
        ['vendor-config.query', 'vendor-config.mutation'],
    );

    $this->actingAs($user)
        ->get("/companies/{$company->username}/dashboard/vendor-registrations")
        ->assertForbidden();
});

test('linked accounts route requires settings query permission', function () {
    $company = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'rbac-sync-linked',
    ]);
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);

    attachCompanyMember($user, $company, "company:{$company->id}:viewer", []);

    $this->actingAs($user)
        ->get("/companies/{$company->username}/dashboard/linked-accounts")
        ->assertForbidden();
});

test('waiting lists index follows booking query permission', function () {
    $company = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'rbac-sync-waiting-lists',
    ]);
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);

    attachCompanyMember($user, $company, "company:{$company->id}:booking-viewer", ['booking.query']);

    $this->actingAs($user)
        ->get("/companies/{$company->username}/dashboard/waiting-lists")
        ->assertOk();
});

test('booking list report requires booking list query permission instead of reports query permission', function () {
    $company = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'rbac-sync-booking-list',
    ]);
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);

    attachCompanyMember($user, $company, "company:{$company->id}:reports-only", ['reports.query']);

    $this->actingAs($user)
        ->get("/companies/{$company->username}/dashboard/reports/bookings")
        ->assertForbidden();

    $role = Role::query()->where('name', "company:{$company->id}:reports-only")->firstOrFail();
    $role->syncPermissions(
        Permission::query()->whereIn('name', ['reports.query', 'booking-list.query'])->get(),
    );

    $this->actingAs($user)
        ->get("/companies/{$company->username}/dashboard/reports/bookings")
        ->assertOk();
});

test('vendor can open own my catalogs route with tour management query permission', function () {
    $company = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'rbac-sync-my-catalogs-vendor',
    ]);
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);

    attachCompanyMember($user, $company, "company:{$company->id}:tour-viewer", ['tour-management.query']);

    $this->actingAs($user)
        ->get("/companies/{$company->username}/dashboard/vendors/{$company->username}/tours")
        ->assertOk();
});

test('agent own my catalogs route follows tour management query permission', function () {
    $company = Company::factory()->create([
        'type' => CompanyType::AGENT,
        'username' => 'rbac-sync-my-catalogs-agent',
    ]);
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);

    attachCompanyMember($user, $company, "company:{$company->id}:tour-viewer", ['tour-management.query']);

    $this->actingAs($user)
        ->get("/companies/{$company->username}/dashboard/vendors/{$company->username}/tours")
        ->assertOk();
});
