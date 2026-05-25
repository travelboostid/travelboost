<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customers\UpdatePasswordRequest;
use App\Http\Requests\Customers\UpdateProfileRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user()->load('photo');

        return Inertia::render('companies/dashboard/customers/profile', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'username' => $user->username,
                'gender' => $user->gender?->value ?? (string) $user->gender,
                'photo_id' => $user->photo_id,
                'photo_url' => $user->photo_url,
                'province_id' => $user->province_id,
                'city_id' => $user->city_id,
                'district_id' => $user->district_id,
                'village_id' => $user->village_id,
                'postal_code' => $user->postal_code,
            ],
        ]);
    }

    public function update(UpdateProfileRequest $request, string $username): RedirectResponse
    {
        $request->user()->update($request->validated());

        return back()->with('success', 'Profile updated successfully.');
    }

    public function updatePassword(UpdatePasswordRequest $request, string $username): RedirectResponse
    {
        $request->user()->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        return back()->with('success', 'Password updated successfully.');
    }
}
