<?php

namespace App\Http\Controllers\Me;

use App\Enums\CompanyTeamStatus;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\CompanyTeam;
use Illuminate\Support\Facades\Auth;

class TeamInvitationController extends Controller
{
  public function acceptInvitation(string $code)
  {
    $companyTeam = CompanyTeam::where('invite_token', $code)->first();
    if ($companyTeam == null) {
      return redirect('me.index');
    }
    if ($companyTeam->status !== CompanyTeamStatus::PENDING) {
      return redirect('me.index');
    }
    if ($companyTeam->invite_email !== Auth::user()->email) {
      return redirect('me.index');
    }

    $companyTeam->user_id = Auth::id();
    $companyTeam->status = CompanyTeamStatus::ACTIVE;
    $companyTeam->save();
    $user = Auth::user();
    $user->status = UserStatus::ACTIVE;
    $user->save();
    $user->addRole($companyTeam->invite_role, "company:{$companyTeam->company_id}");
    session()->forget('company_team_invite_token');
    return redirect()->route('companies.dashboard.index', ['company' => $companyTeam->company->username]);
  }
}
