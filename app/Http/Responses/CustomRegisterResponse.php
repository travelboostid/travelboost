<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\RegisterResponse;

class CustomRegisterResponse implements RegisterResponse
{
  public function toResponse($request)
  {
    $user = $request->user();
    return match ($request->input('intent')) {
      'register-as-agent' => $this->processRegisterAsAgent($user, $request),
      'register-as-vendor' => $this->processRegisterAsVendor($user, $request),
      'register-as-customer' => $this->processRegisterAsCustomer($user, $request),
      'register-as-team' => $this->processRegisterAsTeam($user, $request),
      default => $this->processRegisterDefault($user, $request),
    };
  }

  private function processRegisterAsAgent(User $user, Request $request)
  {
    return redirect()->route('me.index');
  }

  private function processRegisterAsVendor(User $user, Request $request)
  {
    return redirect()->route('me.index');
  }

  private function processRegisterAsCustomer(User $user, Request $request)
  {
    return redirect()->route('me.index');
  }

  private function processRegisterAsTeam(User $user, Request $request)
  {
    $company = $user->companies()->first();
    return redirect()->route('companies.dashboard.index', ['company' => $company->username]);
  }

  private function processRegisterDefault(User $user, Request $request)
  {
    return redirect()->route('me.index');
  }
}
