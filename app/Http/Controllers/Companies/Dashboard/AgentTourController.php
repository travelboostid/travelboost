<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AgentTour;
use App\Models\Company;
use Inertia\Inertia;

class AgentTourController extends Controller
{
  public function index(Company $company)
  {
    $tours = $company->agentTours()->get();
    return Inertia::render('companies/dashboard/agent-tours/index', [
      'data' => $tours,
    ]);
  }

  public function destroy(Company $company, AgentTour $tour)
  {
    $tour->delete();
    return back();
  }
}
