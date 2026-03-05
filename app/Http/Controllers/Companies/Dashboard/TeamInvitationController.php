<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompanyTeamInvitationRequest;
use App\Models\Company;
use App\Models\CompanyTeamInvitation;
use App\Models\User;

class TeamInvitationController extends Controller
{

  /**
   * Store a newly created resource in storage.
   */
  public function store(StoreCompanyTeamInvitationRequest $request, Company $company)
  {
    $validated = $request->validated();
    $existingUser = User::where('email', $validated['email'])->first();

    if (isset($existingUser)) {
      $validated['user_id'] = $existingUser->id;
    } else {
      $validated['user_id'] = null; // Set to null if user does not exist
    }

    $company->invitations()->create($validated);
    return back();
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Company $company, CompanyTeamInvitation $team_invitation)
  {
    $team_invitation->delete(); // Delete the invitation
    return back();
  }
}
