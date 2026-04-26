<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\CompanyTeam;
use App\Models\User;
use App\Enums\CompanyType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AgentAuthController extends Controller
{
  public function showLogin(Request $request): Response
  {
    return Inertia::render('agent-auth/login');
  }

  public function login(Request $request)
  {
    $request->validate([
      'username_or_email' => 'required|string',
      'password' => 'required|string',
    ]);

    $loginType = filter_var($request->username_or_email, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
    $user = User::where($loginType, $request->username_or_email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
      return back()->withErrors([
        'username_or_email' => 'The provided credentials are incorrect.',
      ])->onlyInput('username_or_email');
    }

    $agentTeam = CompanyTeam::where('user_id', $user->id)
      ->whereHas('company', function ($query) {
        $query->where('type', CompanyType::AGENT);
      })
      ->with('company')
      ->first();

    if (!$agentTeam) {
      return back()->withErrors([
        'access_denied' => 'Your account is not registered as an Agent in Travelboost. Please make sure you are logging into the correct portal or register as an Agent to continue.',
      ]);
    }

    $statusValue = $user->status instanceof \BackedEnum ? $user->status->value : $user->status;

    if (strtolower(trim((string)$statusValue)) === 'inactive') {
      return back()->with('account_inactive', 'Your account has been deactivated, contact the Travelboost admin at care@travelboost.co.id for further information.');
    }

    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();

    return redirect()->route('company.index', ['company' => $agentTeam->company->username]);
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

    return Inertia::render('agent-auth/register', [
      'affiliate' => $affiliate
    ]);
  }
}
