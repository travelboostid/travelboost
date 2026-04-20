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
        'login' => 'Kredensial yang diberikan tidak cocok dengan data kami.',
      ])->onlyInput('login');
    }

    $statusValue = $user->status instanceof \BackedEnum ? $user->status->value : $user->status;

    if (strtolower(trim((string)$statusValue)) === 'inactive') {
      return back()->with('account_inactive', 'Akun anda sudah di nonaktifkan, hubungi admin travelboost di email care@travelboost.co.id untuk keterangan lebih lanjut.');
    }

    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();

    $profile = AffiliateProfile::where('user_id', $user->id)->first();
    if ($profile && $profile->status !== 'approved') {
      $request->session()->flash('warning', 'Akun Anda belum disetujui, harap lengkapi profil Anda.');
    }

    return redirect()->intended('/affiliate/dashboard');
  }

  public function showRegister(Request $request)
  {
    $referralCode = null;
    $uplineName = null;

    /** @var Domain|null $domainData */
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

    $user = User::create([
      'name' => $request->name,
      'email' => $request->email,
      'username' => $request->username,
      'password' => Hash::make($request->password),
      'status' => 'active',
    ]);

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
    ]);

    event(new Registered($user));
    Auth::login($user);

    return redirect('/affiliate/dashboard')->with('warning', 'Registrasi berhasil. Akun Anda sedang menunggu persetujuan tim.');
  }

  public function logout(Request $request)
  {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect('/affiliate');
  }
}
