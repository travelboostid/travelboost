<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Inertia\Inertia;

class HomeController extends Controller
{
  public function index(Company $company)
  {
    $agentSubscription = $company->agentSubscription()->with('package')->latest()->first();
    return Inertia::render('companies/dashboard/home/index', [
      'agentSubscription' => $agentSubscription,
    ]);
  }
}
