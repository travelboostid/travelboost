<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AffiliateProfile;
use App\Models\Domain;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AffiliateAuthController extends Controller
{
  public function showLogin()
  {
    return Inertia::render('affiliate/auth/login');
  }

  public function login(Request $request)
  {
    $request->validate([
      'login' => 'required|string',
      'password' => 'required|string',
    ]);

    $loginType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
    $user = User::where($loginType, $request->login)->first();

    if ($user) {
      $hasAffiliateProfile = AffiliateProfile::where('user_id', $user->id)->exists();
      if (!$hasAffiliateProfile) {
        return back()->withErrors([
          'access_denied' => 'The email or username entered is not registered as an Affiliate, MA, or Partner here. Please make sure you are logging into the correct portal.',
        ])->onlyInput('login');
      }
    }

    if (!$user || !Hash::check($request->password, $user->password)) {
      return back()->withErrors([
        'login' => 'The provided credentials are incorrect.',
      ])->onlyInput('login');
    }

    $statusValue = $user->status instanceof \BackedEnum ? $user->status->value : $user->status;

    if (strtolower(trim((string)$statusValue)) === 'inactive') {
      return back()->with('account_inactive', 'Your account has been deactivated, contact the Travelboost admin at care@travelboost.co.id for further information.');
    }

    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();

    $profile = AffiliateProfile::where('user_id', $user->id)->first();
    if ($profile && $profile->status !== 'approved') {
      $request->session()->flash('warning', 'Your account has not been approved yet. Please complete your profile.');
    }

    return redirect()->intended('/affiliate/dashboard');
  }

  public function showRegister(Request $request)
  {
    $referralCode = null;
    $uplineName = null;

    $domainData = Context::get('domain');

    if ($domainData && $domainData->owner instanceof AffiliateProfile) {
      $referralCode = $domainData->owner->referral_code;
      $uplineName = $domainData->owner->user->name;
    }

    return Inertia::render('affiliate/auth/register', [
      'referralCode' => $referralCode,
      'uplineName' => $uplineName,
    ]);
  }

  public function register(Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255',
      'email' => 'required|string|email|max:255|unique:users,email',
      'username' => 'required|string|max:255|unique:users,username',
      'password' => 'required|string|confirmed|min:8',
      'referral_code' => 'nullable|string',
      'ktp_number' => 'required|numeric|digits:16',
      'ktp_file' => 'required|image|mimes:jpeg,png,jpg|max:2048',
    ]);

    $uplineId = null;
    if ($request->referral_code) {
      $uplineProfile = AffiliateProfile::where('referral_code', $request->referral_code)->first();
      $uplineId = $uplineProfile ? $uplineProfile->user_id : null;
    }

    $ktpPath = $request->hasFile('ktp_file') ? $request->file('ktp_file')->store('ktp_uploads', 'public') : null;

    DB::transaction(function () use ($request, $uplineId, $ktpPath, &$user) {
      $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'username' => $request->username,
        'password' => Hash::make($request->password),
        'status' => 'active',
      ]);

      $user->addRole('user:affiliate');

      $affiliate = AffiliateProfile::create([
        'user_id' => $user->id,
        'upline_id' => $uplineId,
        'referral_code' => $request->username,
        'tier' => 'affiliate',
        'status' => 'pending',
        'identity_number' => $request->ktp_number,
        'identity_photo_path' => $ktpPath,
      ]);

      Domain::create([
        'owner_id' => $affiliate->id,
        'owner_type' => AffiliateProfile::class,
        'subdomain' => $request->username,
        'domain_enabled' => false,
        'subdomain_enabled' => false,
      ]);
    });

    event(new Registered($user));
    Auth::login($user);

    return redirect('/affiliate/dashboard')->with('warning', 'Registration successful. Your account is awaiting team approval.');
  }

  public function logout(Request $request)
  {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect('');
  }
}
