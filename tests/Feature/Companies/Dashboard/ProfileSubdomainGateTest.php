<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Domain;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAgentPartner;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    DB::table('agent_subscription_packages')->insertOrIgnore([
        'id' => 1,
        'name' => 'Free Trial 1 Month',
        'duration_months' => 1,
        'price' => 0,
        'is_active' => true,
    ]);
});

function attachSettingsManager(User $user, Company $company): void
{
    $roleName = "company:{$company->id}:settings-manager";

    $role = Role::query()->firstOrCreate(
        ['name' => $roleName],
        ['display_name' => 'Settings Manager'],
    );

    $role->syncPermissions([
        Permission::query()->where('name', 'settings.query')->firstOrFail(),
        Permission::query()->where('name', 'settings.mutation')->firstOrFail(),
    ]);

    CompanyTeam::query()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'invite_email' => $user->email,
        'invite_role' => $roleName,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $user->addRoles(['user:agent', $roleName], "company:{$company->id}");
}

function createPackageOneAgentForProfileGate(): Company
{
    $agent = Company::factory()->create([
        'type' => CompanyType::AGENT,
    ]);

    $agent->agentSubscription()->create([
        'package_id' => 1,
        'started_at' => now()->subDay(),
        'ended_at' => now()->addMonth(),
    ]);

    Domain::query()->create([
        'subdomain' => $agent->username,
        'owner_type' => $agent->getMorphClass(),
        'owner_id' => $agent->id,
        'domain_enabled' => false,
        'subdomain_enabled' => true,
    ]);

    return $agent;
}

function attachVendorPartnerForProfileGate(Company $agent, bool $allowPackageOneAgents): Company
{
    $vendor = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'allow_package_one_agents' => $allowPackageOneAgents,
    ]);

    VendorAgentPartner::query()->create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
    ]);

    return $vendor;
}

test('agent profile update disables subdomain for package one agent without allowed vendor', function () {
    $agent = createPackageOneAgentForProfileGate();
    attachVendorPartnerForProfileGate($agent, false);

    $user = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);
    attachSettingsManager($user, $agent);

    $this->actingAs($user)->put("/companies/{$agent->username}/dashboard/profile", [
        'name' => $agent->name,
        'email' => $agent->email,
        'username' => $agent->username,
        'phone' => $agent->phone,
        'customer_service_phone' => $agent->customer_service_phone,
        'address' => $agent->address,
        'subdomain' => $agent->username,
        'domain_enabled' => false,
    ])->assertRedirect();

    expect($agent->domain()->firstOrFail()->subdomain_enabled)->toBeFalse();
});

test('agent profile update keeps subdomain enabled for package one agent with allowed vendor', function () {
    $agent = createPackageOneAgentForProfileGate();
    attachVendorPartnerForProfileGate($agent, true);

    $user = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);
    attachSettingsManager($user, $agent);

    $this->actingAs($user)->put("/companies/{$agent->username}/dashboard/profile", [
        'name' => $agent->name,
        'email' => $agent->email,
        'username' => $agent->username,
        'phone' => $agent->phone,
        'customer_service_phone' => $agent->customer_service_phone,
        'address' => $agent->address,
        'subdomain' => $agent->username,
        'domain_enabled' => false,
    ])->assertRedirect();

    expect($agent->domain()->firstOrFail()->subdomain_enabled)->toBeTrue();
});
