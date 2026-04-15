<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use Inertia\Inertia;

class AgentSubscriptionController extends Controller
{
  // Display the agent subscription details for a specific company
  public function show(Company $company)
  {
    // Retrieve all available agent subscription packages
    $agentSubscriptionPackages = AgentSubscriptionPackage::all();

    // Get the latest agent subscription for the company, including the associated package
    $agentSubscription = $company->agentSubscription()->with('package')->latest()->first();

    // Render the Inertia view with the retrieved data
    return Inertia::render('companies/dashboard/agent-subscriptions/index', [
      'agentSubscription' => $agentSubscription,
      'agentSubscriptionPackages' => $agentSubscriptionPackages
    ]);
  }
}
