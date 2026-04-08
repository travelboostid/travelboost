<?php

namespace App\Http\Middleware;

use App\Models\AgentSubscription;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAgentSubscriptionIsActive
{
  /**
   * Handle an incoming request.
   *
   * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
   */
  public function handle(Request $request, Closure $next): Response
  {
    $company = $request->route('company');
    $subscription = AgentSubscription::where('company_id', $company->id)->latest()->first();
    if (! $subscription || $subscription->status !== 'active') {
      return redirect()->route('company.agent-subscriptions.show', ['company' => $company->username]);
    }
    return $next($request);
  }
}
