<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CustomerLoginController extends Controller
{
    public function show()
    {
        $tenant = request()->attributes->get('tenant');

        return Inertia::render('tenant/auth/login', [
            'status' => session('status'),
            'canResetPassword' => false,
            'canRegister' => true,
            'company' => $tenant,
        ]);
    }

    public function authenticate(Request $request)
    {
        $tenant = $request->attributes->get('tenant');

        $request->validate([
            'username_or_email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $loginType = filter_var($request->username_or_email, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $credentials = [
            $loginType => $request->username_or_email,
            'password' => $request->password,
            'company_id' => $tenant->id,
        ];

        if (Auth::guard('customer')->attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            return redirect()->intended('/');
        }

        return back()->withErrors([
            'username_or_email' => 'Kredensial tersebut tidak cocok dengan data kami di agen ini.',
        ])->onlyInput('username_or_email');
    }

    public function destroy(Request $request)
    {
        Auth::guard('customer')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}