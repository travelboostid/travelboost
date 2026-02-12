<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePasswordRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class DashboardSettingsChangePasswordController extends Controller
{
  /**
   * Display the resource.
   */
  public function show()
  {
    $currentUser = Auth::user();

    return Inertia::render('dashboard/settings/change-password', [
      'user' => $currentUser,
    ]);
  }

  /**
   * Update the resource in storage.
   */
  public function update(ChangePasswordRequest $request)
  {
    $request->user()->update([
      'password' => Hash::make($request->password),
    ]);

    return back();
  }
}
