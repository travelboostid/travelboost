<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PersonalPageController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function show($username)
  {
    $user = User::where('username', $username)->first();

    if (! $user) {
      abort(404);
    }
    $user->load('preference');
    return Inertia::render('personal-page/show', [
      'user' => $user,
    ]);
  }

  public function edit(string $username)
  {
    $user = User::where('username', $username)->first();

    if (! $user) {
      abort(404);
    }
    $user->load('preference');
    return Inertia::render('personal-page/design', [
      'user' => $user,
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, string $username)
  {
    $user = Auth::user();
    if (! $user) abort(404);
    if (! $user->username != $request->username) abort(404);

    $preference = UserPreference::firstOrCreate(
      ['user_id' => Auth::id()]
    );

    $rules = [
      'landing_page_template_data' => 'string'
    ];

    // Validate request
    $validated = $request->validate($rules);

    $preference->update($validated);

    return back()->with('success', 'Preferences updated successfully.');
  }
}
