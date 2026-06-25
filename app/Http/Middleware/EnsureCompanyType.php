<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyType
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string ...$allowedTypes): Response
    {
        $company = $request->route('company');

        if (is_string($company)) {
            $company = Company::query()->where('username', $company)->firstOrFail();
        }

        abort_unless($company instanceof Company, 403);

        $companyType = strtolower($company->type->value ?? (string) $company->type);
        abort_unless(in_array($companyType, $allowedTypes, true), 403);

        return $next($request);
    }
}
