<?php

namespace App\Http\Responses;

use App\Models\User;
use Laravel\Fortify\Contracts\LoginResponse;

class CustomLoginResponse implements LoginResponse
{
  public function toResponse($request)
  {
    $user = $request->user();

    return match ($request->input('intent')) {
      'login-as-admin' => $this->processLoginAsAdmin($user, $request),
      'login-as-agent' => $this->processLoginAsAgent($user, $request),
      'login-as-vendor' => $this->processLoginAsVendor($user, $request),
      'login-as-customer' => $this->processLoginAsCustomer($user, $request),
      default => $this->processLoginDefault($user, $request),
    };
  }

  private function processLoginAsAdmin(User $user, $request)
  {
    if (! $user->hasRole('company:0:superadmin')) {
      return null;
    }

    return redirect()->route('admin.dashboard');
  }

  private function processLoginAsAgent($user, $request)
  {
    $company = $user->companies()->first();

    return redirect()->route('companies.dashboard.index', [
      'company' => $company->username,
    ]);
  }

  private function processLoginAsVendor($user, $request)
  {
    $company = $user->companies()->first();

    return redirect()->route('companies.dashboard.index', [
      'company' => $company->username,
    ]);
  }

  private function processLoginAsCustomer($user, $request)
  {
    return redirect()->intended(route('me.index'));
  }

  private function processLoginDefault($user, $request)
  {
    return redirect()->route('me.index');
  }
}
