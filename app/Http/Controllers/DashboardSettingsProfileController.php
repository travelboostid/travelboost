<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardSettingsProfileController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function show()
  {
    $currentUser = Auth::user();
    return Inertia::render('dashboard/settings/profile', [
      'user' => $currentUser,
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateProfileRequest $request)
  {
    $user = Auth::user();

    $user->update($request->validated());

    return back();
  }
}
