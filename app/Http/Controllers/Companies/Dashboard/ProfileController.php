<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
  public function show(Company $company)
  {
    $company->load(['domain']);
    return Inertia::render('companies/dashboard/profile/index', [
      'profile' => $company,
    ]);
  }

  public function update(Request $request, Company $company)
  {
    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'email' => 'required|email|max:255',
      'username' => 'required|string|max:255|unique:companies,username,' . $company->id,
      'phone' => 'required|string|max:255',
      'customer_service_phone' => 'required|string|max:255',
      'address' => 'required|string',
      'province' => 'required|string',
      'city' => 'required|string',
      'district' => 'required|string',
      'village' => 'required|string',
      'postal_code' => 'nullable|string',
      'subdomain' => 'required|string|max:255|unique:domains,subdomain,' . ($company->domain->id ?? 'NULL'),
      'domain_enabled' => 'boolean',
      'domain' => 'nullable|string|max:255|unique:domains,domain,' . ($company->domain->id ?? 'NULL'),
      'photo_id' => 'nullable|integer',
      'identity_number' => 'required|string|size:16',
      'identity_id' => 'nullable|image|max:2048',
    ]);

    $updateDomainDto = Arr::only($validated, ['subdomain', 'domain', 'domain_enabled']);
    $companyDto = Arr::except($validated, ['subdomain', 'domain', 'domain_enabled', 'identity_photo']);

    if ($request->hasFile('identity_photo')) {
      if ($company->identity_photo_path) {
        Storage::disk('public')->delete($company->identity_photo_path);
      }
      $file = $request->file('identity_photo');
      $filename = time() . '_company_identity_' . uniqid() . '.' . $file->getClientOriginalExtension();
      $companyDto['identity_photo_path'] = $file->storeAs('companies/identities', $filename, 'public');
    }

    $company->forceFill($companyDto)->save();
    $company->domain()->updateOrCreate([], $updateDomainDto);

    return back()->with('success', 'Profile updated successfully.');
  }
}
