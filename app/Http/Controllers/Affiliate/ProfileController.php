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
      'affiliateProfile.upline.affiliateProfile.upline'
    ]);

    return Inertia::render('affiliate/dashboard/setup/profile', [
      'user' => $user
    ]);
  }

  public function update(Request $request)
  {
    $user = $request->user();

    $validated = $request->validate([
      'phone' => 'nullable|string|max:20',
      'address' => 'nullable|string',
      'province' => 'nullable|string|max:100',
      'city' => 'nullable|string|max:100',
      'district' => 'nullable|string|max:100',
      'village' => 'nullable|string|max:100',
      'postal_code' => 'nullable|string|max:20',
      'identity_number' => 'nullable|string|max:50',
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
      $pathId = $request->file('identity_photo')->store('affiliate/identities', 'public');
      $profileData['identity_photo_path'] = $pathId;
    }

    if ($request->hasFile('profile_photo')) {
      if ($user->affiliateProfile && $user->affiliateProfile->profile_photo_path) {
        Storage::disk('public')->delete($user->affiliateProfile->profile_photo_path);
      }
      $pathProfile = $request->file('profile_photo')->store('affiliate/profiles', 'public');
      $profileData['profile_photo_path'] = $pathProfile;
    }

    $user->affiliateProfile()->updateOrCreate(
      ['user_id' => $user->id],
      $profileData
    );

    $user->update([
      'phone' => $validated['phone'],
      'address' => $validated['address'],
    ]);

    return back()->with('success', 'Profile updated successfully.');
  }
}
