<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserPreferenceRequest;
use App\Models\UserPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardSettingsPreferencesController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function show()
  {
    $preference = UserPreference::where("user_id", Auth::id())->first();
    return Inertia::render('dashboard/settings/preferences', [
      'preference' => $preference,
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateUserPreferenceRequest $request)
  {
    $preference = UserPreference::firstOrCreate(
      ['user_id' => Auth::id()]
    );

    $preference->update($request->validated());

    return back()->with('success', 'Preferences updated successfully.');
  }
}
