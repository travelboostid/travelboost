<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\UpdateProfileRequest;
use App\Models\Company;
use Illuminate\Support\Arr;
use Inertia\Inertia;

class ProfileController extends Controller
{
  public function show(Company $company)
  {
    $company->load(['domain', 'identityCard']);
    return Inertia::render('companies/dashboard/profile/index', [
      'profile' => $company,
    ]);
  }

  public function update(UpdateProfileRequest $request, Company $company)
  {
    $validated = $request->validated();

    $updateDomainDto = Arr::only($validated, ['subdomain', 'domain', 'domain_enabled']);
    $companyDto = Arr::except($validated, ['subdomain', 'domain', 'domain_enabled']);

    $company->forceFill($companyDto)->save();
    $company->domain()->updateOrCreate([], $updateDomainDto);

    return back()->with('success', 'Profile updated successfully.');
  }
}
