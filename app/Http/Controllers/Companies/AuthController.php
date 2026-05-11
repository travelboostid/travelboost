<?php

namespace App\Http\Controllers\Companies;

use App\Enums\CompanyTeamStatus;
use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\CompanyTeam;
use App\Models\User;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Http\Requests\Companies\AcceptTeamInvitationRequest;
use App\Http\Requests\Companies\LoginRequest;
use App\Http\Requests\Companies\RegisterRequest;
use App\Support\Rules\UserRules;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
  public function showLogin(Request $request): Response
  {
    return Inertia::render('companies/auth/login');
  }

  public function login(LoginRequest $request)
  {
    $validated = $request->validated();

    $loginType = filter_var($validated['username_or_email'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
    $user = User::where($loginType, $validated['username_or_email'])->first();

    if (!$user || !Hash::check($validated['password'], $user->password)) {
      return back()->withErrors([
        'username_or_email' => 'The provided credentials are incorrect.',
      ])->onlyInput('username_or_email');
    }

    $team = CompanyTeam::where('user_id', $user->id)
      ->with('company')
      ->first();

    if (!$team) {
      return back()->withErrors([
        'access_denied' => 'Your account is not registered in Travelboost. Please make sure you are logging into the correct portal or register to continue.',
      ]);
    }

    if ($user->status === UserStatus::INACTIVE) {
      return back()->with('account_inactive', 'Your account has been deactivated, contact the Travelboost admin at care@travelboost.co.id for further information.');
    }

    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();

    return redirect()->route('companies.dashboard.index', ['company' => $team->company->username]);
  }

  public function showRegister(Request $request): Response
  {
    $domain = Context::get('domain');

    $affiliate = null;
    if ($domain && $domain->owner_type === AffiliateProfile::class) {
      $profile = $domain->owner;
      $user = $profile->user;
      $affiliate = [
        'id' => $profile->user_id,
        'name' => $user->name,
        'username' => $domain->subdomain
      ];
    }

    return Inertia::render('companies/auth/register', [
      'affiliate' => $affiliate
    ]);
  }

  public function register(RegisterRequest $request)
  {
    $validated = $request->validated();

    $user = DB::transaction(function () use ($validated) {
      $user = User::create([
        ...$validated,
        'password' => Hash::make($validated['password']),
        'status' => UserStatus::INACTIVE,
      ]);

      $user->addRole('user:agent');
      return $user;
    });

    event(new Registered($user));
    Auth::login($user);
    $request->session()->regenerate();

    return redirect()->route('me.index');
  }

  public function showAcceptTeamInvitation(Request $request): Response
  {
    $validated = $request->validate([
      'token' => ['required', 'string']
    ]);
    $team = CompanyTeam::where('invite_token', $validated['token'])->with(['user', 'company'])->firstOrFail();
    return Inertia::render('team-invitation-auth/accept', [
      'team' => $team
    ]);
  }

  public function acceptTeamInvitation(AcceptTeamInvitationRequest $request)
  {
    $validated = $request->validated();

    $validated['company_id'] = null;
    $validated['status'] = UserStatus::ACTIVE;

    $team = CompanyTeam::with(['company'])->where('invite_token', $validated['token'])->first();
    if (!$team) {
      return redirect()->back()->withErrors([
        'email' => 'Invalid invitation token.',
      ]);
    }

    $validated['email'] = $team->invite_email;

    $user = DB::transaction(function () use ($validated, $team) {
      $user = User::create($validated);
      $team->update([
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
      ]);
      $userRole = $team->company->type === CompanyType::AGENT ? 'user:agent' : 'user:vendor';
      $teamRole = $team->invite_role;
      $user->addRoles([$userRole, $teamRole]);

      // Reject other invitations with the same email
      CompanyTeam::where('invite_email', $user->email)
        ->where('status', CompanyTeamStatus::PENDING)
        ->where('id', '!=', $team->id)
        ->update(['status' => CompanyTeamStatus::REJECTED]);
      return $user;
    });

    Auth::login($user);
    $request->session()->regenerate();

    return redirect()->route('companies.dashboard.index', ['company' => $team->company->username]);
  }
}
