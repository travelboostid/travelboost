<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\UpdateProfileRequest;
use App\Models\Company;
use Inertia\Inertia;

class ProfileController extends Controller
{
  /**
   * Display the resource.
   */
  public function show(Company $company)
  {
    $company->load(['domain']);
    return Inertia::render('companies/dashboard/profile/index', [
      'profile' => $company,
    ]);
  }

  /**
   * Update the resource in storage.
   */
  public function update(UpdateProfileRequest $request, Company $company)
  {
    $validated = $request->validated();

    $company->update($validated);

    return back()->with('success', 'Profile updated successfully.');
  }
}
