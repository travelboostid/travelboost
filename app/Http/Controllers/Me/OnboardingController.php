<?php

namespace App\Http\Controllers\Me;

use App\Enums\CompanyTeamRole;
use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Me\CreateCompanyRequest;
use App\Models\Company;
use App\Models\CompanyTeam;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OnboardingController extends Controller
{
  /**
   * Show the form for creating the resource.
   */
  public function index()
  {
    return Inertia::render('me/onboarding/index');
  }

  public function createCompany(CreateCompanyRequest $request)
  {
    $validated = $request->validated();
    $company = Company::create([
      'type' => CompanyType::AGENT,
      'name' => $validated['name'],
      'username' => $validated['username'],
      'email' => $validated['email'],
    ]);
    CompanyTeam::create([
      'company_id' => $company->id,
      'user_id' => Auth::id(),
      'role' => CompanyTeamRole::SUPERADMIN,
      'status' => CompanyTeamStatus::ACTIVE,
    ]);
    Auth::user()->update([
      'status' => UserStatus::ACTIVE,
    ]);

    return redirect()->route('company.index', [
      'company' => $company->username,
    ]);
  }
}
