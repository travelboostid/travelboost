<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserIndexRequest;
use App\Http\Resources\AnonymousUserResource;
use App\Http\Resources\UserResource;
use App\Models\AnonymousUser;
use App\Models\User;
use Illuminate\Support\Str;

class AnonymousUserController extends Controller
{
  /**
   * Display a listing of the users.
   * @operationId setupAnonymousUser
   */
  public function setupAnonymousUser()
  {
    // get token from cookie
    $token = request()->cookie('anonymous_user_token');
    if ($token) {
      $anonymousUser = AnonymousUser::where('token', $token)->first();
      if ($anonymousUser) {
        return new AnonymousUserResource($anonymousUser);
      }
    } else {
      // create new anonymous user
      $anonymousUser = AnonymousUser::create([
        'token' => Str::uuid()->toString(),
      ]);

      // set token in cookie for 1 year
      cookie()->queue('anonymous_user_token', $anonymousUser->token, 60 * 24 * 365);

      return AnonymousUserResource::make($anonymousUser);
    }
  }
}
