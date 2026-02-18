<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserPreferenceRequest;
use App\Http\Resources\UserPreferenceResource;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class UserPreferenceController extends Controller
{
  /**
   * Update user preference
   * @operationId updateUserPreference
   */
  public function update(UpdateUserPreferenceRequest $request, User $user)
  {
    $currentUser = Auth::user();
    if ($currentUser->id !== $user->id) {
      abort(403, 'Unauthorized');
    }

    $user->preference()->updateOrCreate(
      ['user_id' => $user->id],
      $request->validated()
    );

    return new UserPreferenceResource(
      $user->fresh()->load('preference')
    );
  }
}
