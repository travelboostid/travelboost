<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use Inertia\Inertia;

class AgentSubscriptionController extends Controller
{
  public function show(Company $company)
  {
    $agentSubscriptionPackages = AgentSubscriptionPackage::all();
    $agentSubscription = $company->agentSubscription()->with('package')->latest()->first();
    return Inertia::render('companies/dashboard/agent-subscriptions/index', [
      'agentSubscription' => $agentSubscription,
      'agentSubscriptionPackages' => $agentSubscriptionPackages
    ]);
  }
}
