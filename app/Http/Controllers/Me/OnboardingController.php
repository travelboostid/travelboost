<?php

namespace App\Http\Controllers\Me;

use App\Enums\CompanyTeamRole;
use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use App\Models\CompanyTeam;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;
use Inertia\Inertia;

class OnboardingController extends Controller
{
  public function index()
  {
    $user = Auth::user();
    $domain = Context::get('domain');

    $affiliate = null;
    if ($domain && $domain->owner_type === AffiliateProfile::class) {
      $profile = $domain->owner;
      $affiliate = [
        'id' => $profile->user_id,
        'name' => $profile->user->name ?? '',
        'username' => $domain->subdomain
      ];
    }

    $invitations = CompanyTeam::where('invite_email', $user->email)
      ->where('status', CompanyTeamStatus::PENDING)
      ->with('company')
      ->get();

    return Inertia::render('me/onboarding/index', [
      'invitations' => $invitations,
      'affiliate' => $affiliate,
    ]);
  }

  public function createCompany(Request $request)
  {
    /** @var \App\Models\User $user */
    $user = Auth::user();

    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'email' => 'required|email|max:255',
      'username' => 'required|string|max:255|unique:companies,username',
      'subdomain' => 'required|string|max:255|unique:domains,subdomain',
      'phone' => 'required|string|max:255',
      'customer_service_phone' => 'required|string|max:255',
      'address' => 'required|string',
      'province' => 'required|string',
      'city' => 'required|string',
      'district' => 'required|string',
      'village' => 'required|string',
      'postal_code' => 'nullable|string',
      'identity_number' => 'required|string|size:16',
      'identity_card_id' => 'required|integer|exists:medias,id',
      'photo_id' => 'nullable|integer|exists:medias,id',
    ]);

    $validatedCompanyDto = Arr::except($validated, ['subdomain']);
    $validatedCompanyDto['type'] = CompanyType::AGENT;

    $domain = Context::get('domain');
    if ($domain && $domain->owner_type === AffiliateProfile::class) {
      $validatedCompanyDto['referred_by'] = $domain->owner->user_id;
    }

    $company = Company::forceCreate($validatedCompanyDto);

    $company->domain()->create([
      'subdomain' => $validated['subdomain'],
      'domain_enabled' => false,
    ]);

    CompanyTeam::create([
      'company_id' => $company->id,
      'user_id' => $user->id,
      'role' => CompanyTeamRole::SUPERADMIN,
      'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $trialPackage = AgentSubscriptionPackage::where('name', 'Free Trial 1 Month')->first();

    if ($trialPackage) {
      AgentSubscription::create([
        'company_id' => $company->id,
        'package_id' => $trialPackage->id,
        'started_at' => now(),
        'ended_at' => now()->addMonth(),
      ]);
    }

    $user->update([
      'status' => UserStatus::ACTIVE,
    ]);

    $user->addRole("company:{$company->id}:superadmin", "company:{$company->id}");

    return redirect()->route('companies.dashboard.index', [
      'company' => $company->username,
    ]);
  }

  public function acceptInvitation(CompanyTeam $invitation)
  {
    /** @var \App\Models\User $user */
    $user = Auth::user();

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

    CompanyTeam::where('invite_email', $user->email)
      ->where('status', CompanyTeamStatus::PENDING)
      ->where('id', '!=', $invitation->id)
      ->update(['status' => CompanyTeamStatus::REJECTED]);

    return redirect()->route('companies.dashboard.index', [
      'company' => $invitation->company->username,
    ]);
  }

  public function declineInvitations()
  {
    $user = Auth::user();

    CompanyTeam::where('invite_email', $user->email)
      ->where('status', CompanyTeamStatus::PENDING)
      ->update(['status' => CompanyTeamStatus::REJECTED]);

    return back();
  }
}
