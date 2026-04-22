<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Support\Facades\DB;
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
      'dailyStats' => $company->aiUsageLogs()
        ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(user_cost) as cost'), DB::raw('COUNT(*) as num_interactions'))
        ->groupBy('date')
        ->orderBy('date')
        ->get(),
      // Calculate today's usage cost
      'usageCostToday' => $company->aiUsageLogs()->whereDate('created_at', now()->toDateString())->sum('user_cost'),
      // Calculate usage cost for the last 30 days
      'usageCostIn30Days' => $company->aiUsageLogs()->where('created_at', '>=', now()->subDays(30)->toDateString())->sum('user_cost'),
    ]);
  }
}
