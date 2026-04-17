<?php

namespace App\Http\Middleware;

use App\Models\AnonymousUser;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
  /**
   * The root template that's loaded on the first page visit.
   *
   * @see https://inertiajs.com/server-side-setup#root-template
   *
   * @var string
   */
  protected $rootView = 'app';

  /**
   * Determines the current asset version.
   *
   * @see https://inertiajs.com/asset-versioning
   */
  public function version(Request $request): ?string
  {
    return parent::version($request);
  }

  /**
   * Define the props that are shared by default.
   *
   * @see https://inertiajs.com/shared-data
   *
   * @return array<string, mixed>
   */
  public function share(Request $request): array
  {
    // Only share if route has {company} parameter
    $company = $request->route('company');
    $anonymousUserToken = $request->cookie('anonymous_user_token');
    $anonymousUser = $anonymousUserToken ? AnonymousUser::where('token', $anonymousUserToken)->first() : null;

    if (!$anonymousUser && !$request->user()) {
      $anonymousUser = AnonymousUser::create([
        'token' => (string) \Illuminate\Support\Str::uuid(),
      ]);
      \Illuminate\Support\Facades\Cookie::queue('anonymous_user_token', $anonymousUser->token, 60 * 24 * 365);
    }

    return [
      ...parent::share($request),
      'name' => config('app.name'),
      'appDomain' => env('APP_HOST', 'localhost'),
      // current authenticated user
      'auth' => [
        'user' => $request->user()?->load(['companies']),
        'permissions' => $request->user()?->allPermissions()->pluck('name')->toArray(),
        'roles' => $request->user()?->roles->pluck('name')->toArray(),
        'teams' => $request->user()?->allTeams()->pluck('name')->toArray(),
      ],
      // current company based on route parameter (don't interpret as user's current company!!!)
      'company' => $company,
      // current tenant based on route parameter (don't interpret as user's tenant!!!)
      'tenant' => $request->attributes->get('tenant'),
      'anonymousUser' => $anonymousUser,
      'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',

      'flash' => [
        'account_inactive' => $request->session()->get('account_inactive'),
        'warning' => $request->session()->get('warning'),
        'success' => $request->session()->get('success'),
      ],
    ];
  }
}
