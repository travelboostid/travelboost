<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyTeamStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\InviteCompanyTeamRequest;
use App\Models\Company;
use App\Models\CompanyTeam;
use Inertia\Inertia;
use App\Http\Requests\UpdateCompanyTeamRequest;
use App\Models\Role;
use App\Models\User;
use App\Notifications\TeamInvitationNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class TeamController extends Controller
{
  public function index(Company $company)
  {
    $members = $company->teams()
      ->with(['user.roles'])
      ->get();
    $roles = Role::where('name', 'like', "company:{$company->id}:%")
      ->get();
    return Inertia::render('companies/dashboard/teams/index', [
      'members' => $members,
      'roles' => $roles,
    ]);
  }

  public function invite(InviteCompanyTeamRequest $request, Company $company)
  {
    $validated = $request->validated();
    $email = $validated['invite_email'];
    $existingUser = User::where('email', $email)->first();
    $userId = $existingUser?->id;

    // Check both registered users and pending invitations
    $alreadyInvited = $company->teams()
      ->where(function ($q) use ($userId, $email) {
        if ($userId) {
          $q->where('user_id', $userId);
        } else {
          $q->where('invite_email', $email);
        }
      })
      ->exists();

    if ($alreadyInvited) {
      return back()->withErrors(['invite_email' => 'User already invited.']);
    }

    $company->teams()->create([
      ...$validated,
      'user_id' => $userId,
      'invite_token' => Str::uuid(),
      'invited_at' => now(),
    ]);

    return back()->with('success', 'Invitation sent.');
  }

  public function resendInvitation(Company $company, CompanyTeam $team)
  {
    if ($team->status != CompanyTeamStatus::PENDING) {
      return back()->withErrors(['email' => 'Invitation cannot be resent.']);
    }

    // Send to email or user depending on acceptance status
    if ($team->user == null) {
      Notification::route('mail', $team->invite_email)
        ->notify(new TeamInvitationNotification($team));
    } else {
      Notification::send($team->user, new TeamInvitationNotification($team));
    }

    return back();
  }

  public function update(UpdateCompanyTeamRequest $request, Company $company, CompanyTeam $team)
  {
    $team->load('user.roles');
    $validated = $request->validated();
    $roleName = $validated['role'] ?? null;
    $rest = collect($validated)->except('role')->toArray();

    // Update user role if provided
    if ($roleName) {
      $role = Role::where('name', $roleName)->first();
      $existingRoles = $team->user->roles()->where('name', 'like', "company:{$company->id}:%")->pluck('name')->toArray();
      $team->user->removeRoles($existingRoles, "company:{$company->id}");
      $team->user->addRole($role, "company:{$company->id}");
    }

    $team->update($rest);
    return back();
  }

  public function destroy(Company $company, CompanyTeam $team)
  {
    $team->delete();
    return back();
  }
}
