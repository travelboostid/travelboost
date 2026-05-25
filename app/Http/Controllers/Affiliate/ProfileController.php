<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user()->load([
            'affiliateProfile.upline',
            'affiliateProfile.photo',
            'affiliateProfile.identityCard',
        ]);

        return Inertia::render('affiliate/dashboard/setup/profile', [
            'user' => $user,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'province_id' => 'nullable|integer|exists:'.config('laravolt.indonesia.table_prefix').'provinces,id',
            'city_id' => 'nullable|integer|exists:'.config('laravolt.indonesia.table_prefix').'cities,id',
            'district_id' => 'nullable|integer|exists:'.config('laravolt.indonesia.table_prefix').'districts,id',
            'village_id' => 'nullable|integer|exists:'.config('laravolt.indonesia.table_prefix').'villages,id',
            'postal_code' => 'nullable|string|max:20',
            'identity_number' => 'required|string|max:50',
            'identity_card_id' => 'nullable|integer|exists:medias,id',
            'photo_id' => 'nullable|integer|exists:medias,id',
        ]);

        $profileData = [
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'province_id' => $validated['province_id'],
            'city_id' => $validated['city_id'],
            'district_id' => $validated['district_id'],
            'village_id' => $validated['village_id'],
            'postal_code' => $validated['postal_code'],
            'identity_number' => $validated['identity_number'],
        ];

        if (isset($validated['identity_card_id'])) {
            $profileData['identity_card_id'] = $validated['identity_card_id'];
            // Optionally clean up old physical files if you are migrating from the old approach
            if ($user->affiliateProfile && $user->affiliateProfile->identity_photo_path) {
                Storage::disk('public')->delete($user->affiliateProfile->identity_photo_path);
                $profileData['identity_photo_path'] = null;
            }
        }

        if (isset($validated['photo_id'])) {
            $profileData['photo_id'] = $validated['photo_id'];
            // Optionally clean up old physical files
            if ($user->affiliateProfile && $user->affiliateProfile->profile_photo_path) {
                Storage::disk('public')->delete($user->affiliateProfile->profile_photo_path);
                $profileData['profile_photo_path'] = null;
            }
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
