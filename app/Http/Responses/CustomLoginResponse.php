<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse;

class CustomLoginResponse implements LoginResponse
{
  public function toResponse($request)
  {
    if (session()->has('intent') && session()->get('intent') === 'accept_company_team_invitation' && session()->has('company_team_invite_token')) {
      return redirect()->route('me.team-invitations.accept', ['code' => session()->pull('company_team_invite_token')]);
    }
    $company = $request->user()->companies()->first();
    if ($company != null) {
      return redirect()->route('company.index', [
        'company' => $company->username,
      ]);
    }
    return redirect()->route('me.index');
  }
}
