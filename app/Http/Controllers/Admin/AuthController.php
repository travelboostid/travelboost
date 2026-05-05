<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
  public function showLogin(): Response
  {
    return Inertia::render('admin/auth/login');
  }

  public function login(Request $request)
  {
    $validated = $request->validate([
      'username_or_email' => 'required|string',
      'password' => 'required|string',
    ]);

    $loginType = filter_var($validated['username_or_email'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
    $user = User::where($loginType, $validated['username_or_email'])->first();

    if (!$user || !Hash::check($validated['password'], $user->password)) {
      return back()->withErrors([
        'username_or_email' => 'The provided credentials are incorrect.',
      ])->onlyInput('username_or_email');
    }

    if (!$user->hasRole('user:admin')) {
      return back()->withErrors([
        'username_or_email' => 'The provided credentials are incorrect.',
      ]);
    }

    if ($user->status === UserStatus::INACTIVE) {
      return back()->withErrors([
        'username_or_email' => 'Your account has been deactivated, contact the Travelboost admin at care@travelboost.co.id for further information.',
      ]);
    }

    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();

    return redirect()->route('admin.dashboard');
  }
}
