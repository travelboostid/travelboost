<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Inertia\Inertia;

class AiCreditController extends Controller
{
  // Display the AI credit dashboard for a specific company
  public function show(Company $company)
  {
    // Retrieve company settings
    $settings = $company->settings()->first();

    // Get the AI credit information
    $credit = $company->aiCredit()->first();

    // Render the Inertia view with necessary data
    return Inertia::render('companies/dashboard/ai-credits/index', [
      'settings' => $settings,
      'credit' => $credit,
      // Fetch the last 30 billing cycles ordered by date
      'billingCycles' => $company->aiBillingCycles()->orderBy('date', 'asc')->limit(30)->get(),
      // Calculate today's usage cost
      'usageCostToday' => $company->aiBillingCycles()->where('date', now()->toDateString())->sum('cost'),
      // Calculate usage cost for the last 30 days
      'usageCostIn30Days' => $company->aiBillingCycles()->where('date', '>=', now()->subDays(30)->toDateString())->sum('cost'),
    ]);
  }
}
