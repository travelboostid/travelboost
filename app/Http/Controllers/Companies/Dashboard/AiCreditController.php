<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Inertia\Inertia;

class AiCreditController extends Controller
{

  /**
   * Display the specified resource.
   */
  public function show(Company $company)
  {
    $settings = $company->settings()->first();
    $credit = $company->aiCredit()->first();
    return Inertia::render('companies/dashboard/ai-credits/index', [
      'settings' => $settings,
      'credit' => $credit,
      'billingCycles' => $company->aiBillingCycles()->orderBy('date', 'asc')->limit(30)->get(),
      'usageCostToday' => $company->aiBillingCycles()->where('date', now()->toDateString())->sum('cost'),
      'usageCostIn30Days' => $company->aiBillingCycles()->where('date', '>=', now()->subDays(30)->toDateString())->sum('cost'),
    ]);
  }
}
