<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfileSettingsController extends Controller
{
  /**
   * Display the resource.
   */
  public function show(Company $company)
  {
    return Inertia::render('companies/dashboard/settings/profile', [
      'company' => $company,
    ]);
  }

  /**
   * Update the resource in storage.
   */
  public function update(Request $request, Company $company)
  {
    $validated = $request->validate([
      'username' => 'nullable|string|max:255|unique:companies,username,' . $company->id,
      'name' => 'required|string|max:255',
      'phone' => 'nullable|string|max:20',
      'address' => 'nullable|string|max:255',
      'photo_id' => 'nullable|exists:medias,id',
    ]);

    $company->update($validated);

    return back()->with('success', 'Profile updated successfully.');
  }
}
