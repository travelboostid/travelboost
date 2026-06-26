<?php

namespace App\Http\Controllers\Customers;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customers\LoginRequest;
use App\Http\Requests\Customers\RegisterRequest;
use App\Models\Company;
use App\Models\User;
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

        $redirect = $request->query('redirect');
        if (is_string($redirect) && $this->isSafeReturnPath($redirect)) {
            session()->put('url.intended', $redirect);
        }

        if (! session()->has('url.intended')) {
            $referer = $request->headers->get('referer');
            if (is_string($referer) && $this->isSafeReturnUrl($referer)) {
                session()->put('url.intended', $referer);
            }
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

        return redirect($this->resolvePostAuthRedirect($request));
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

        return redirect($this->resolvePostAuthRedirect($request));
    }

    private function resolvePostAuthRedirect(Request $request): string
    {
        $intended = session()->pull('url.intended');

        if (is_string($intended) && $this->isSafeReturnUrl($intended)) {
            return $intended;
        }

        return $this->customerPostAuthRedirect($request);
    }

    private function customerPostAuthRedirect(Request $request): string
    {
        if ($this->isOnTenantSubdomain($request)) {
            return '/';
        }

        return route('me.index');
    }

    private function isOnTenantSubdomain(Request $request): bool
    {
        $tenant = Context::get('tenant');

        return $tenant instanceof Company;
    }

    private function isSafeReturnUrl(string $value): bool
    {
        if ($this->isSafeReturnPath($value)) {
            return true;
        }

        $host = parse_url($value, PHP_URL_HOST);
        $scheme = parse_url($value, PHP_URL_SCHEME);

        if (! is_string($host) || $host === '') {
            return false;
        }

        if (! in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        return $host === $this->currentHost();
    }

    private function isSafeReturnPath(string $value): bool
    {
        if ($value === '' || $value[0] !== '/') {
            return false;
        }

        if (str_starts_with($value, '//')) {
            return false;
        }

        return true;
    }

    private function currentHost(): string
    {
        $appHost = (string) config('app.host', 'localhost');
        $requestHost = request()->getHost();

        if ($requestHost === $appHost) {
            return $appHost;
        }

        $subdomainSuffix = '.'.$appHost;
        if (str_ends_with($requestHost, $subdomainSuffix)) {
            return $requestHost;
        }

        return $appHost;
    }
}
