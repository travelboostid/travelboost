<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
  /**
   * Get current authenticated user
   */
  public function me()
  {
    return new UserResource(
      Auth::user()->load('preference')
    );
  }

  /**
   * Update current user profile
   */
  public function update(UpdateUserRequest $request)
  {
    $user = Auth::user();

    $user->update(
      $request->validated()
    );

    return new UserResource(
      $user->fresh()->load('preference')
    );
  }
}
