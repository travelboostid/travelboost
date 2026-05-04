<?php

namespace App\Http\Controllers;

use App\Models\CompanyTeam;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamInvitationAuthController extends Controller
{
    public function showAccept(Request $request): Response
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);
        $team = CompanyTeam::where('invite_token', $validated['token'])->with(['user', 'company'])->firstOrFail();

        return Inertia::render('team-invitation-auth/accept', [
            'team' => $team,
        ]);
    }
}
