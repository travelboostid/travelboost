<?php

namespace App\Http\Middleware;

use App\Models\Company;
use App\Support\CompanyPermissionMap;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyPermission
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $company = $request->route('company');

        if (is_string($company)) {
            $company = Company::query()->where('username', $company)->firstOrFail();
        }

        abort_unless($company instanceof Company, 403);

        $user = $request->user();
        abort_unless($user, 403);

        $hasPermission = collect($permissions)
            ->filter()
            ->contains(fn (string $permission): bool => CompanyPermissionMap::userHasScopedPermission(
                $user,
                $company,
                $permission,
            ));

        abort_unless($hasPermission, 403);

        return $next($request);
    }
}
