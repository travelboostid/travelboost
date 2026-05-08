<?php

namespace App\Http\Controllers\Customers;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customers\LoginRequest;
use App\Http\Requests\Customers\RegisterRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
  public function showLogin(Request $request): Response
  {
    if ($request->filled('redirect')) {
      session()->put('url.intended', $request->query('redirect'));
    }

    if (! session()->has('url.intended') && $request->headers->get('referer')) {
      session()->put('url.intended', $request->headers->get('referer'));
    }

    return Inertia::render('customers/auth/login');
  }

  public function showRegister(Request $request): Response
  {
    return Inertia::render('customers/auth/register');
  }

  public function login(LoginRequest $request)
  {
    $validated = $request->validated();

    $loginType = filter_var($validated['username_or_email'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
    $user = User::where($loginType, $validated['username_or_email'])->where('company_id', $validated['company_id'])->first();

    if (! $user || ! Hash::check($validated['password'], $user->password)) {
      return back()->withErrors([
        'username_or_email' => 'The provided credentials are incorrect.',
      ])->onlyInput('username_or_email');
    }

    if ($user->status === UserStatus::INACTIVE) {
      return back()->with('account_inactive', 'Your account has been deactivated, contact the Travelboost admin at care@travelboost.co.id for further information.');
    }

    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();

    return redirect()->intended($request->input('redirect', route('me.index')));
  }

  public function register(RegisterRequest $request)
  {
    $validated = $request->validated();

    $user = DB::transaction(function () use ($validated) {
      $user = User::create(array_merge($validated, [
        'password' => Hash::make($validated['password']),
        'status' => UserStatus::ACTIVE,
      ]));

      $user->addRole('user:customer');
      return $user;
    });

    event(new Registered($user));
    Auth::login($user);
    $request->session()->regenerate();

    return redirect()->intended(route('me.index'));
  }
}
