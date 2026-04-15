<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AffiliateProfile;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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

    if (!$user || !Hash::check($request->password, $user->password)) {
      return back()->withErrors([
        'login' => 'The provided credentials do not match our records.',
      ])->onlyInput('login');
    }

    if (!$user->hasVerifiedEmail()) {
      return redirect()->route('affiliate.verify.notice')->with('warning', 'Your email address is not verified.');
    }

    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();

    return redirect()->intended('/affiliate/dashboard');
  }

  public function showRegister(Request $request, $subdomain = null)
  {
    $referralCode = $subdomain;
    $uplineName = null;

    if ($referralCode) {
      $upline = User::where('username', $referralCode)->first();
      $uplineName = $upline ? $upline->name : null;
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
    ], [
      'username.unique' => 'This username is already taken.',
    ]);

    // Cari ID Upline
    $uplineId = null;
    if ($request->referral_code) {
      $upline = User::where('username', $request->referral_code)->first();
      $uplineId = $upline ? $upline->id : null;
    }

    $user = User::create([
      'name' => $request->name,
      'email' => $request->email,
      'username' => $request->username,
      'password' => Hash::make($request->password),
      'status' => 'active',
    ]);

    // Role Laratrust (Affiliator)
    // if (method_exists($user, 'addRole')) {
    //   $user->addRole('affiliator');
    // }

    AffiliateProfile::create([
      'user_id'       => $user->id,
      'upline_id'     => $uplineId,
      'referral_code' => $request->username,
      'tier'          => 'affiliate',
      'status' => 'pending',
    ]);

    event(new Registered($user));

    return redirect('/affiliate/verify-notice');
  }

  public function logout(Request $request)
  {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/affiliate');
  }
}
