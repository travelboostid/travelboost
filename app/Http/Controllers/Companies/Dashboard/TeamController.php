<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyTeamStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\InviteCompanyTeamRequest;
use App\Models\Company;
use App\Models\CompanyTeam;
use Inertia\Inertia;
use App\Http\Requests\UpdateCompanyTeamRequest; // Ensure you import the request class
use App\Models\Role;
use App\Models\User;
use App\Notifications\TeamInvitationNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class TeamController extends Controller
{
  /**
   * Display a listing of the resource.
   */
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

  /**
   * Store a newly created resource in storage.
   */
  public function invite(InviteCompanyTeamRequest $request, Company $company)
  {
    $validated = $request->validated();
    $email = $validated['invite_email'];
    $existingUser = User::where('email', $email)->first();
    $userId = $existingUser?->id;
    // prevent duplicate invite
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
    if ($team->user == null) {
      Notification::route('mail', $team->invite_email)
        ->notify(new TeamInvitationNotification($team));
    } else {
      Notification::send($team->user, new TeamInvitationNotification($team));
    }

    // Then you can trigger the email sending logic (not implemented here)

    return back();
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateCompanyTeamRequest $request, Company $company, CompanyTeam $member)
  {
    $member->update($request->validated());
    return back();
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Company $company, CompanyTeam $team)
  {
    $team->delete();
    return back();
  }
}
