<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\RegisterResponse;

class CustomRegisterResponse implements RegisterResponse
{
  public function toResponse($request)
  {
    if (session()->has('intent') && session()->get('intent') === 'accept_company_team_invitation' && session()->has('company_team_invite_token')) {
      return redirect()->route('me.team-invitations.accept', ['code' => session()->pull('company_team_invite_token')]);
    }

    return redirect()->route('me.index');
  }
}
