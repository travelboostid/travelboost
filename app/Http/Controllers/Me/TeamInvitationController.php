<?php

namespace App\Http\Controllers\Me;

use App\Enums\CompanyTeamStatus;
use App\Http\Controllers\Controller;
use App\Models\CompanyTeam;
use Illuminate\Support\Facades\Auth;

class TeamInvitationController extends Controller
{
  public function acceptInvitation(string $code)
  {
    $team = CompanyTeam::where('code', $code)->first();
    if ($team == null) {
      return redirect('me.index');
    }
    if ($team->status !== 'pending') {
      return redirect('me.index');
    }
    if ($team->email !== Auth::user()->email) {
      return redirect('me.index');
    }
    $team->status = CompanyTeamStatus::ACTIVE;
    $team->save();
    return redirect()->route('company.index', $team->company->username);
  }
}
