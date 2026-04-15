<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse;

class CustomLoginResponse implements LoginResponse
{
  public function toResponse($request)
  {
    $user = $request->user();

    // Redirect superadmins to the admin dashboard
    if ($user && $user->hasRole('company:0:superadmin')) {
      return redirect('/admin/dashboard');
    }

    // If a tenant was resolved during authentication, redirect to home
    $tenant = $request->attributes->get('tenant');
    if ($tenant != null) {
      return redirect('/');
    }

    // Redirect users to their first company
    $company = $request->user()->companies()->first();
    if ($company != null) {
      return redirect()->route('company.index', [
        'company' => $company->username,
      ]);
    }

    // Default: redirect to user profile
    return redirect()->route('me.index');
  }
}
