<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompanyMemberInvitationRequest;
use App\Models\Company;
use App\Models\CompanyMemberInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MemberInvitationController extends Controller
{

  /**
   * Store a newly created resource in storage.
   */
  public function store(StoreCompanyMemberInvitationRequest $request, Company $company)
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
  public function destroy(Company $company, CompanyMemberInvitation $invitation)
  {
    $invitation->delete(); // Delete the invitation
    return back();
  }
}
