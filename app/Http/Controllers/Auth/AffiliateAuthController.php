<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AffiliateProfile;
use App\Enums\UserStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
// use Illuminate\Auth\Events\Registered; // TODO: Aktifkan saat fitur email verifikasi di-deploy

class AffiliateAuthController extends Controller
{
  public function showRegister()
  {
    return Inertia::render('affiliate/auth/register');
  }

  public function showLogin()
  {
    return Inertia::render('affiliate/auth/login');
  }

  public function register(Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255',
      'email' => 'required|string|email|max:255|unique:users',
      'username' => 'required|string|max:50|unique:users,username|regex:/^[a-z0-9_-]+$/',
      'phone' => 'required|string|max:20',
      'password' => 'required|string|min:8|confirmed',
      'referral_code' => 'nullable|string|exists:affiliate_profiles,referral_code'
    ], [
      'email.unique' => 'Email sudah terdaftar.',
      'username.unique' => 'Username sudah terpakai.',
      'username.regex' => 'Hanya huruf kecil, angka, strip, atau underscore.',
      'referral_code.exists' => 'Kode referensi tidak valid.'
    ]);

    $uplineId = null;
    $roleToAssign = 'affiliate';

    if ($request->referral_code) {
      $uplineProfile = AffiliateProfile::where('referral_code', $request->referral_code)->first();

      if ($uplineProfile) {
        $uplineId = $uplineProfile->user_id;
        $uplineUser = User::find($uplineId);

        if ($uplineUser && $uplineUser->hasRole('partner')) {
          $roleToAssign = 'master_affiliate';
        }
      }
    }

    $user = User::create([
      'name' => $request->name,
      'email' => $request->email,
      'username' => strtolower($request->username),
      'phone' => $request->phone,
      'password' => Hash::make($request->password),
      'status' => UserStatus::ACTIVE,
    ]);

    /** @var \App\Models\User $user */
    $user->addRole($roleToAssign);

    AffiliateProfile::create([
      'user_id' => $user->id,
      'upline_id' => $uplineId,
      'referral_code' => strtolower($request->username),
    ]);

    // HAPUS Auth::login($user)
    // Ubah redirect agar tetap di halaman untuk memicu modal sukses
    return back();
  }

  public function login(Request $request)
  {
    $request->validate([
      'login' => 'required|string',
      'password' => 'required|string',
    ]);

    // Cek input berupa email atau username
    $loginType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

    $credentials = [
      $loginType => $request->login,
      'password' => $request->password
    ];

    if (Auth::attempt($credentials, $request->boolean('remember'))) {
      $request->session()->regenerate();

      /** @var \App\Models\User $user */
      $user = Auth::user();

      // Redirect ke dashboard afiliasi sesuai role
      if ($user->hasRole(['partner', 'master_affiliate', 'affiliate'])) {
        return redirect()->route('affiliate.dashboard');
      }

      return redirect()->intended('/dashboard');
    }

    return back()->withErrors([
      'login' => 'Email/Username atau password salah.',
    ]);
  }
}
