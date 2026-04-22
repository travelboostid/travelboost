<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
  public function edit(Request $request)
  {
    $user = $request->user()->load([
      'affiliateProfile.upline'
    ]);

    return Inertia::render('affiliate/dashboard/setup/profile', [
      'user' => $user
    ]);
  }

  public function update(Request $request)
  {
    $user = $request->user();

    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'phone' => 'required|string|max:20',
      'address' => 'nullable|string',
      'province' => 'nullable|string|max:100',
      'city' => 'nullable|string|max:100',
      'district' => 'nullable|string|max:100',
      'village' => 'nullable|string|max:100',
      'postal_code' => 'nullable|string|max:20',
      'identity_number' => 'required|string|max:50',
      'identity_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
      'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
    ]);

    $profileData = [
      'phone' => $validated['phone'],
      'address' => $validated['address'],
      'province' => $validated['province'],
      'city' => $validated['city'],
      'district' => $validated['district'],
      'village' => $validated['village'],
      'postal_code' => $validated['postal_code'],
      'identity_number' => $validated['identity_number'],
    ];

    if ($request->hasFile('identity_photo')) {
      if ($user->affiliateProfile && $user->affiliateProfile->identity_photo_path) {
        Storage::disk('public')->delete($user->affiliateProfile->identity_photo_path);
      }
      $identityFile = $request->file('identity_photo');
      $identityFileName = time() . '_identity_' . uniqid() . '.' . $identityFile->getClientOriginalExtension();
      $profileData['identity_photo_path'] = $identityFile->storeAs('affiliate/identities', $identityFileName, 'public');
    }

    if ($request->hasFile('profile_photo')) {
      if ($user->affiliateProfile && $user->affiliateProfile->profile_photo_path) {
        Storage::disk('public')->delete($user->affiliateProfile->profile_photo_path);
      }
      $profileFile = $request->file('profile_photo');
      $profileFileName = time() . '_profile_' . uniqid() . '.' . $profileFile->getClientOriginalExtension();
      $profileData['profile_photo_path'] = $profileFile->storeAs('affiliate/profiles', $profileFileName, 'public');
    }

    $user->affiliateProfile()->updateOrCreate(
      ['user_id' => $user->id],
      $profileData
    );

    $user->update([
      'name' => $validated['name'],
      'phone' => $validated['phone'],
      'address' => $validated['address'],
    ]);

    return back()->with('success', 'Profile updated successfully.');
  }
}
