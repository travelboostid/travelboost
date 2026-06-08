<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\User;
use App\Notifications\TeamAccountNotification;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->owner = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);

    $this->company = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'username' => 'team-test-company',
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
});

test('owner can create a team member account directly', function () {
    Notification::fake();

    $response = $this->actingAs($this->owner)->post(
        "/companies/{$this->company->username}/dashboard/teams/invite",
        [
            'name' => 'Operations User',
            'email' => 'operations@example.com',
            'username' => 'operations-user',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => "company:{$this->company->id}:admin",
        ]
    );

    $response->assertRedirect();

    $user = User::where('email', 'operations@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->status)->toBe(UserStatus::ACTIVE);

    $team = CompanyTeam::where('company_id', $this->company->id)
        ->where('user_id', $user->id)
        ->first();

    expect($team)->not->toBeNull();
    expect($team->status)->toBe(CompanyTeamStatus::ACTIVE);
    expect($team->accepted_at)->not->toBeNull();
    expect($team->invite_email)->toBe('operations@example.com');
    expect($team->invite_role)->toBe("company:{$this->company->id}:admin");

    expect(
        $user->roles()->where('name', "company:{$this->company->id}:admin")->exists()
    )->toBeTrue();

    Notification::assertSentOnDemand(TeamAccountNotification::class);
});

test('owner can update a team members status role email and password', function () {
    Notification::fake();

    $member = User::factory()->create([
        'status' => UserStatus::ACTIVE,
        'email' => 'member@example.com',
        'username' => 'member-user',
        'password' => 'Password123!',
    ]);

    $member->addRoles([
        'user:vendor',
        "company:{$this->company->id}:admin",
    ]);

    $team = CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $member->id,
        'invite_email' => $member->email,
        'invite_role' => "company:{$this->company->id}:admin",
        'invited_at' => now(),
        'accepted_at' => now(),
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $response = $this->actingAs($this->owner)->put(
        "/companies/{$this->company->username}/dashboard/teams/{$team->id}",
        [
            'role' => "company:{$this->company->id}:superadmin",
            'status' => 'suspended',
            'email' => 'updated-member@example.com',
            'password' => 'UpdatedPassword123!',
            'password_confirmation' => 'UpdatedPassword123!',
        ]
    );

    $response->assertRedirect();

    $team->refresh();
    $member->refresh();

    expect($team->status)->toBe(CompanyTeamStatus::SUSPENDED);
    expect($team->invite_email)->toBe('updated-member@example.com');
    expect($team->invite_role)->toBe("company:{$this->company->id}:superadmin");
    expect($member->email)->toBe('updated-member@example.com');
    expect(password_verify('UpdatedPassword123!', $member->password))->toBeTrue();
    expect(
        $member->roles()->where('name', "company:{$this->company->id}:superadmin")->exists()
    )->toBeTrue();

    Notification::assertSentOnDemand(TeamAccountNotification::class);
});

test('owner can delete a team member and deactivate standalone login access', function () {
    $member = User::factory()->create([
        'status' => UserStatus::ACTIVE,
        'email' => 'delete-member@example.com',
        'username' => 'delete-member',
    ]);

    $member->addRoles([
        'user:vendor',
        "company:{$this->company->id}:admin",
    ]);

    $team = CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $member->id,
        'invite_email' => $member->email,
        'invite_role' => "company:{$this->company->id}:admin",
        'invited_at' => now(),
        'accepted_at' => now(),
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $response = $this->actingAs($this->owner)->delete(
        "/companies/{$this->company->username}/dashboard/teams/{$team->id}"
    );

    $response->assertRedirect();

    expect(
        CompanyTeam::where('id', $team->id)->exists()
    )->toBeFalse();

    $member->refresh();
    expect($member->status)->toBe(UserStatus::INACTIVE);
});
