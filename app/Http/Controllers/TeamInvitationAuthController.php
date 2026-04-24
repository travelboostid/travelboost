<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\CompanyTeam;
use Illuminate\Support\Facades\Context;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class TeamInvitationAuthController extends Controller
{
  public function showAccept(Request $request): Response
  {
    $validated = $request->validate([
      'token' => ['required', 'string']
    ]);
    $team = CompanyTeam::where('invite_token', $validated['token'])->with(['user', 'company'])->firstOrFail();
    return Inertia::render('team-invitation-auth/accept', [
      'team' => $team
    ]);
  }
}
