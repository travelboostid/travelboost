<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse;

class CustomLoginResponse implements LoginResponse
{
  public function toResponse($request)
  {
    $tenant = $request->attributes->get('tenant');

    if ($tenant != null) {
      return redirect()->route('me.index');
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
