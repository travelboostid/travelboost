<?php

namespace App\Http\Middleware;

use App\Enums\CompanyTeamStatus;
use App\Models\CompanyTeam;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHasCompanyAccess
{
  /**
   * Handle an incoming request.
   *
   * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
   */
  public function handle(Request $request, Closure $next): Response
  {
    $company = $request->route('company');
    $user = $request->user();

    $team = CompanyTeam::where('company_id', $company->id)
      ->where('user_id', $user->id)
      ->first();

    if (! $team) {
      return redirect('/');
    }

    if ($team->status !== CompanyTeamStatus::ACTIVE) {
      return redirect('/');
    }
    return $next($request);
  }
}
