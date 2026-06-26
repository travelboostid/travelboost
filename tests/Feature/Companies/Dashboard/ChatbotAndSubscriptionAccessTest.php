<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->owner = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);

    $this->company = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'test-company-settings',
    ]);

    $this->agentCompany = Company::factory()->create([
        'type' => CompanyType::AGENT,
        'username' => 'test-agent-company-settings',
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

    // Create a subscription package so AgentSubscriptionController show can retrieve it
    $this->subscriptionPackage = AgentSubscriptionPackage::factory()->create([
        'is_active' => true,
    ]);
});

test('user without chatbot or subscription query permissions cannot view protected pages', function () {
    $nonPrivilegedUser = User::factory()->create(['status' => UserStatus::ACTIVE]);

    $vendorRole = Role::create([
        'name' => "company:{$this->company->id}:custom-staff",
        'display_name' => 'Custom Staff',
    ]);
    $agentRole = Role::create([
        'name' => "company:{$this->agentCompany->id}:custom-staff",
        'display_name' => 'Custom Staff',
    ]);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $nonPrivilegedUser->id,
        'invite_email' => $nonPrivilegedUser->email,
        'invite_role' => $vendorRole->name,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    CompanyTeam::create([
        'company_id' => $this->agentCompany->id,
        'user_id' => $nonPrivilegedUser->id,
        'invite_email' => $nonPrivilegedUser->email,
        'invite_role' => $agentRole->name,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $nonPrivilegedUser->addRoles(['user:vendor', 'user:agent', $vendorRole->name, $agentRole->name]);

    // Check Chatbot Show
    $this->actingAs($nonPrivilegedUser)->get(
        "/companies/{$this->company->username}/dashboard/chatbot"
    )->assertStatus(403);

    // Check Chatbot Payment History
    $this->actingAs($nonPrivilegedUser)->get(
        "/companies/{$this->company->username}/dashboard/chatbot/payment-history"
    )->assertStatus(403);

    // Check Agent Subscription Show
    $this->actingAs($nonPrivilegedUser)->get(
        "/companies/{$this->agentCompany->username}/dashboard/agent-subscriptions"
    )->assertStatus(403);
});

test('user with chatbot or subscription query permissions can view protected pages', function () {
    $privilegedUser = User::factory()->create(['status' => UserStatus::ACTIVE]);

    $vendorRole = Role::create([
        'name' => "company:{$this->company->id}:custom-vendor-admin",
        'display_name' => 'Custom Admin',
    ]);
    $vendorRole->syncPermissions(['chat-ai.query']);
    $agentRole = Role::create([
        'name' => "company:{$this->agentCompany->id}:custom-agent-admin",
        'display_name' => 'Custom Agent Admin',
    ]);
    $agentRole->syncPermissions(['subscription-ai.query']);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $privilegedUser->id,
        'invite_email' => $privilegedUser->email,
        'invite_role' => $vendorRole->name,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    CompanyTeam::create([
        'company_id' => $this->agentCompany->id,
        'user_id' => $privilegedUser->id,
        'invite_email' => $privilegedUser->email,
        'invite_role' => $agentRole->name,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $privilegedUser->addRoles(['user:vendor', 'user:agent', $vendorRole->name, $agentRole->name]);

    // Check Chatbot Show
    $this->actingAs($privilegedUser)->get(
        "/companies/{$this->company->username}/dashboard/chatbot"
    )->assertOk();

    // Check Chatbot Payment History
    $this->actingAs($privilegedUser)->get(
        "/companies/{$this->company->username}/dashboard/chatbot/payment-history"
    )->assertOk();

    // Check Agent Subscription Show
    $this->actingAs($privilegedUser)->get(
        "/companies/{$this->agentCompany->username}/dashboard/agent-subscriptions"
    )->assertOk();
});

test('user without chatbot or subscription mutation permissions cannot mutate protected pages', function () {
    Storage::fake('public');

    $queryOnlyUser = User::factory()->create(['status' => UserStatus::ACTIVE]);

    $vendorRole = Role::create([
        'name' => "company:{$this->company->id}:custom-chatbot-query-only",
        'display_name' => 'Custom Chatbot Query Only',
    ]);
    $vendorRole->syncPermissions(['chat-ai.query']);
    $agentRole = Role::create([
        'name' => "company:{$this->agentCompany->id}:custom-subscription-query-only",
        'display_name' => 'Custom Subscription Query Only',
    ]);
    $agentRole->syncPermissions(['subscription-ai.query']);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $queryOnlyUser->id,
        'invite_email' => $queryOnlyUser->email,
        'invite_role' => $vendorRole->name,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    CompanyTeam::create([
        'company_id' => $this->agentCompany->id,
        'user_id' => $queryOnlyUser->id,
        'invite_email' => $queryOnlyUser->email,
        'invite_role' => $agentRole->name,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $queryOnlyUser->addRoles(['user:vendor', 'user:agent', $vendorRole->name, $agentRole->name]);

    // 1. Chatbot Update
    $this->actingAs($queryOnlyUser)->put(
        "/companies/{$this->company->username}/dashboard/chatbot",
        [
            'chatbot_enabled' => true,
        ]
    )->assertStatus(403);

    // 2. Chatbot manual topup
    $this->actingAs($queryOnlyUser)->post(
        "/companies/{$this->company->username}/dashboard/chatbot/manual-topup",
        [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'transfer_amount' => 50000,
            'payment_date' => now()->toDateString(),
            'proof' => UploadedFile::fake()->image('proof.png'),
        ]
    )->assertStatus(403);

    // 3. Agent subscription manual payment
    $this->actingAs($queryOnlyUser)->post(
        "/companies/{$this->agentCompany->username}/dashboard/agent-subscriptions/manual-payment",
        [
            'package_id' => $this->subscriptionPackage->id,
            'transfer_amount' => 50000,
            'payment_date' => now()->toDateString(),
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'proof' => UploadedFile::fake()->image('proof.png'),
        ]
    )->assertStatus(403);
});
