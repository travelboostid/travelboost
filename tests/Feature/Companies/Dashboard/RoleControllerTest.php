<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Role;
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
        'type' => CompanyType::VENDOR,
        'username' => 'role-test-company',
    ]);

    $this->ownerTeam = CompanyTeam::create([
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
        'user:vendor',
        "company:{$this->company->id}:superadmin",
    ]);

    // Let's create a test role
    $this->testRole = Role::create([
        'name' => "company:{$this->company->id}:test-role",
        'display_name' => 'Test Role',
        'description' => 'Test Role Description',
    ]);
});

test('user without settings query permission cannot list roles', function () {
    $nonPrivilegedUser = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $restrictedRole = Role::create([
        'name' => "company:{$this->company->id}:restricted-viewer",
        'display_name' => 'Restricted Viewer',
    ]);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $nonPrivilegedUser->id,
        'invite_email' => $nonPrivilegedUser->email,
        'invite_role' => $restrictedRole->name,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $nonPrivilegedUser->addRoles(['user:vendor', $restrictedRole->name]);

    $response = $this->actingAs($nonPrivilegedUser)->get(
        "/companies/{$this->company->username}/dashboard/roles"
    );

    $response->assertStatus(403);
});

test('user with settings query permission can list roles', function () {
    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/roles"
    );

    $response->assertOk();
});

test('user without settings mutation permission cannot create, update, or delete roles', function () {
    $nonPrivilegedUser = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $restrictedRole = Role::create([
        'name' => "company:{$this->company->id}:restricted-staff",
        'display_name' => 'Restricted Staff',
    ]);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $nonPrivilegedUser->id,
        'invite_email' => $nonPrivilegedUser->email,
        'invite_role' => $restrictedRole->name,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $nonPrivilegedUser->addRoles(['user:vendor', $restrictedRole->name]);

    // Store
    $this->actingAs($nonPrivilegedUser)->post(
        "/companies/{$this->company->username}/dashboard/roles",
        [
            'name' => 'new-role',
            'display_name' => 'New Role',
            'permissions' => [],
        ]
    )->assertStatus(403);

    // Update
    $this->actingAs($nonPrivilegedUser)->put(
        "/companies/{$this->company->username}/dashboard/roles/{$this->testRole->id}",
        [
            'display_name' => 'Updated Test Role',
            'permissions' => [],
        ]
    )->assertStatus(403);

    // Destroy
    $this->actingAs($nonPrivilegedUser)->delete(
        "/companies/{$this->company->username}/dashboard/roles/{$this->testRole->id}"
    )->assertStatus(403);
});

test('user with settings mutation can create, update, and delete roles', function () {
    $response = $this->actingAs($this->owner)->post(
        "/companies/{$this->company->username}/dashboard/roles",
        [
            'name' => 'manager',
            'display_name' => 'Manager',
            'permissions' => ['settings.query' => true],
        ]
    );
    $response->assertRedirect();
    $this->assertDatabaseHas('roles', [
        'name' => "company:{$this->company->id}:manager",
        'display_name' => 'Manager',
    ]);

    $response = $this->actingAs($this->owner)->put(
        "/companies/{$this->company->username}/dashboard/roles/{$this->testRole->id}",
        [
            'display_name' => 'Updated Test Role',
            'permissions' => ['settings.query' => true],
        ]
    );
    $response->assertRedirect();
    expect($this->testRole->fresh()->display_name)->toBe('Updated Test Role');

    $response = $this->actingAs($this->owner)->delete(
        "/companies/{$this->company->username}/dashboard/roles/{$this->testRole->id}"
    );
    $response->assertRedirect();
    $this->assertDatabaseMissing('roles', [
        'id' => $this->testRole->id,
    ]);
});

test('superadmin lockout prevention prevents user from removing view or manage settings from their own role', function () {
    $customRole = Role::create([
        'name' => "company:{$this->company->id}:custom-admin",
        'display_name' => 'Custom Admin',
    ]);
    $customRole->syncPermissions(['settings.query', 'settings.mutation']);

    $this->owner->roles()->sync([$customRole->id]);
    $this->owner->refresh();

    $response = $this->actingAs($this->owner)->put(
        "/companies/{$this->company->username}/dashboard/roles/{$customRole->id}",
        [
            'display_name' => 'Custom Admin',
            'permissions' => [
                'settings.query' => false,
                'settings.mutation' => true,
            ],
        ]
    );

    $response->assertRedirect();
    $response->assertSessionHasErrors(['permissions']);

    $customRole->refresh();
    expect($customRole->hasPermission('settings.query'))->toBeTrue();
    expect($customRole->hasPermission('settings.mutation'))->toBeTrue();
});

test('admin cannot delete their own role', function () {
    $adminUser = User::factory()->create(['status' => UserStatus::ACTIVE]);

    $customRole = Role::create([
        'name' => "company:{$this->company->id}:custom-role",
        'display_name' => 'Custom Role',
    ]);
    $customRole->syncPermissions(['settings.query', 'settings.mutation']);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $adminUser->id,
        'invite_email' => $adminUser->email,
        'invite_role' => $customRole->name,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $adminUser->addRoles(['user:vendor', $customRole->name]);

    $response = $this->actingAs($adminUser)->delete(
        "/companies/{$this->company->username}/dashboard/roles/{$customRole->id}"
    );

    $response->assertRedirect();
    $response->assertSessionHasErrors(['role']);

    $this->assertDatabaseHas('roles', [
        'id' => $customRole->id,
    ]);
});

test('cross company permissions do not leak', function () {
    $userX = User::factory()->create(['status' => UserStatus::ACTIVE]);

    $companyA = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'company-a',
    ]);
    $companyB = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'company-b',
    ]);

    $roleA = Role::create([
        'name' => "company:{$companyA->id}:query-role",
        'display_name' => 'Query Role',
    ]);
    $roleA->syncPermissions(['settings.query']);

    CompanyTeam::create([
        'company_id' => $companyA->id,
        'user_id' => $userX->id,
        'invite_email' => $userX->email,
        'invite_role' => $roleA->name,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $userX->addRoles(['user:vendor', $roleA->name]);

    $roleB = Role::create([
        'name' => "company:{$companyB->id}:empty-role",
        'display_name' => 'Empty Role',
    ]);

    CompanyTeam::create([
        'company_id' => $companyB->id,
        'user_id' => $userX->id,
        'invite_email' => $userX->email,
        'invite_role' => $roleB->name,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $userX->addRoles([$roleB->name]);

    $responseA = $this->actingAs($userX)->get(
        "/companies/{$companyA->username}/dashboard/roles"
    );
    $responseA->assertStatus(200);

    $responseB = $this->actingAs($userX)->get(
        "/companies/{$companyB->username}/dashboard/roles"
    );
    $responseB->assertStatus(403);
});

test('vendor role editor only exposes vendor dashboard permissions', function () {
    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/roles"
    );

    $response->assertInertia(fn (Assert $page) => $page
        ->component('companies/dashboard/roles/index')
        ->where('permissions', function ($permissions): bool {
            $permissionNames = collect($permissions)->pluck('name')->all();

            return in_array('agents.query', $permissionNames, true)
                && in_array('booking-list.query', $permissionNames, true)
                && in_array('room-listings.query', $permissionNames, true)
                && in_array('commission.query', $permissionNames, true)
                && ! in_array('marketings.query', $permissionNames, true)
                && ! in_array('vendor-config.query', $permissionNames, true)
                && ! in_array('subscription-ai.query', $permissionNames, true);
        })
    );
});

test('agent role editor only exposes agent dashboard permissions', function () {
    $agentOwner = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);

    $agentCompany = Company::factory()->create([
        'type' => CompanyType::AGENT,
        'username' => 'role-test-agent-company',
    ]);

    CompanyTeam::create([
        'company_id' => $agentCompany->id,
        'user_id' => $agentOwner->id,
        'invite_email' => $agentOwner->email,
        'invite_role' => "company:{$agentCompany->id}:superadmin",
        'invited_at' => now(),
        'accepted_at' => now(),
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
    ]);

    $agentOwner->addRoles([
        'user:agent',
        "company:{$agentCompany->id}:superadmin",
    ]);

    $response = $this->actingAs($agentOwner)->get(
        "/companies/{$agentCompany->username}/dashboard/roles"
    );

    $response->assertInertia(fn (Assert $page) => $page
        ->component('companies/dashboard/roles/index')
        ->where('permissions', function ($permissions): bool {
            $permissionNames = collect($permissions)->pluck('name')->all();

            return in_array('marketings.query', $permissionNames, true)
                && in_array('vendor-config.query', $permissionNames, true)
                && in_array('subscription-ai.query', $permissionNames, true)
                && in_array('booking-list.query', $permissionNames, true)
                && in_array('seat-availability.query', $permissionNames, true)
                && ! in_array('agents.query', $permissionNames, true)
                && ! in_array('room-listings.query', $permissionNames, true)
                && ! in_array('commission.query', $permissionNames, true);
        })
    );
});
