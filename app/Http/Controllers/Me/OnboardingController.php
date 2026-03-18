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
use App\Models\Domain;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OnboardingController extends Controller
{
  /**
   * Show the form for creating the resource.
   */
  public function index()
  {
    $invitations = CompanyTeam::where('invite_email', Auth::user()->email)
      ->where('status', CompanyTeamStatus::PENDING)
      ->with('company')
      ->get();
    return Inertia::render('me/onboarding/index', [
      'invitations' => $invitations,
    ]);
  }

  public function createCompany(CreateCompanyRequest $request)
  {
    $user = Auth::user()->fresh();
    $validated = $request->validated();
    $validatedCompanyDto = Arr::except($validated, ['domain']);
    $validatedCompanyDto['type'] = CompanyType::AGENT;
    $company = Company::create($validatedCompanyDto);
    CompanyTeam::create([
      'company_id' => $company->id,
      'user_id' => $user->id,
      'role' => CompanyTeamRole::SUPERADMIN,
      'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $user->update([
      'status' => UserStatus::ACTIVE,
    ]);
    $user->addRole("company:{$company->id}:superadmin", "company:{$company->id}");

    return redirect()->route('company.index', [
      'company' => $company->username,
    ]);
  }

  public function acceptInvitation(CompanyTeam $invitation)
  {
    $user = Auth::user()->fresh();
    if ($invitation->invite_email !== $user->email) {
      abort(403);
    }
    if ($invitation->status !== CompanyTeamStatus::PENDING) {
      abort(400, 'Invitation invalid');
    }
    $invitation->update([
      'user_id' => $user->id,
      'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $user->update([
      'status' => UserStatus::ACTIVE,
    ]);
    $user->addRole($invitation->invite_role, "company:{$invitation->company_id}");
    CompanyTeam::where('invite_email', Auth::user()->email)
      ->where('status', CompanyTeamStatus::PENDING)
      ->where('id', '!=', $invitation->id)
      ->update(['status' => CompanyTeamStatus::REJECTED]);

    return redirect()->route('company.index', [
      'company' => $invitation->company->username,
    ]);
  }

  public function declineInvitations()
  {
    CompanyTeam::where('invite_email', Auth::user()->email)
      ->where('status', CompanyTeamStatus::PENDING)
      ->update(['status' => CompanyTeamStatus::REJECTED]);

    return back();
  }
}
