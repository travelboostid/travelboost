<?php

namespace App\Http\Controllers\Companies;

use App\Enums\CompanyTeamStatus;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\CompanyTeam;
use App\Models\User;
use App\Support\Rules\UserRules;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('companies/auth/login');
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'username_or_email' => 'required|string',
            'password' => 'required|string',
        ]);

        $loginType = filter_var($validated['username_or_email'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $user = User::where($loginType, $validated['username_or_email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return back()->withErrors([
                'username_or_email' => 'The provided credentials are incorrect.',
            ])->onlyInput('username_or_email');
        }

        $team = CompanyTeam::where('user_id', $user->id)
            ->with('company')
            ->first();

        if (! $team) {
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
                'username' => $domain->subdomain,
            ];
        }

        return Inertia::render('companies/auth/register', [
            'affiliate' => $affiliate,
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => UserRules::name(),
            'username' => UserRules::username(),
            'email' => UserRules::email(),
            'password' => UserRules::password(),
        ]);

        $user = User::create(array_merge($validated, [
            'password' => Hash::make($validated['password']),
            'status' => UserStatus::INACTIVE,
        ]));

        event(new Registered($user));
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('me.index');
    }

    public function showAcceptTeamInvitation(Request $request): Response
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);
        $team = CompanyTeam::where('invite_token', $validated['token'])->with(['user', 'company'])->firstOrFail();

        return Inertia::render('team-invitation-auth/accept', [
            'team' => $team,
        ]);
    }

    public function acceptTeamInvitation(Request $request)
    {

        $validated = $request->validate([
            'name' => UserRules::name(),
            'username' => UserRules::username(),
            'email' => UserRules::email(),
            'password' => UserRules::password(),
            'token' => ['required', 'string', 'exists:company_teams,invite_token'],
        ]);

        $validated['company_id'] = null;
        $validated['status'] = UserStatus::ACTIVE;

        $team = CompanyTeam::where('invite_token', $validated['token'])->first();
        if (! $team) {
            return null;
        }

        $validated['email'] = $team->invite_email;

        $user = User::create($validated);
        $team->update([
            'user_id' => $user->id,
            'status' => CompanyTeamStatus::ACTIVE,
        ]);
        $user->addRole($team->invite_role, "company:{$team->company_id}");

        CompanyTeam::where('invite_email', $user->email)
            ->where('status', CompanyTeamStatus::PENDING)
            ->where('id', '!=', $team->id)
            ->update(['status' => CompanyTeamStatus::REJECTED]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('companies.dashboard.index', ['company' => $team->company->username]);
    }
}
