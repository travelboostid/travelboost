<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\UserIndexRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
  /**
   * Display a listing of the users.
   * @operationId getUsers
   */
  public function index(UserIndexRequest $request)
  {
    $query = User::query()
      ->with('roles');

    if ($search = $request->search) {
      $query->where(function ($q) use ($search) {
        $q->where('name', 'like', "%{$search}%")
          ->orWhere('email', 'like', "%{$search}%")
          ->orWhere('username', 'like', "%{$search}%");
      });
    }

    if ($role = $request->role) {
      $query->whereHas('roles', function ($q) use ($role) {
        $q->where('name', $role);
      });
    }

    if ($type = $request->type) {
      $query->where('type', $type);
    }

    $users = $query
      ->latest()
      ->paginate($request->perPage())
      ->withQueryString();

    return UserResource::collection($users);
  }
}
