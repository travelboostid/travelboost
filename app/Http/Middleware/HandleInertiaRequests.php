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
    return [
      ...parent::share($request),
      'name' => config('app.name'),
      'appDomain' => env('APP_HOST', 'localhost'),
      'auth' => [
        'user' => $request->user()?->load(['companies']),
      ],
      'company' => $company,
      'tenant' => $request->attributes->get('tenant'),
      'anonymousUser' => $anonymousUser,
      'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
    ];
  }
}
