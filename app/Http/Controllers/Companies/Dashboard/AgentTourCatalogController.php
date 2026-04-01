<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Models\Company;
use App\Models\TourCategory;
use App\Models\VendorAgentPartner;
use Inertia\Inertia;

class AgentTourCatalogController extends Controller
{
  public function index(Company $company)
  {
      $tours = $company->agentTours()
          ->with('company')
          ->active()
          ->when(request('category'), function ($query, $categoryId) {
              $query->where('category_id', $categoryId);
          })
          ->when(request('search'), function ($query, $search) {
              $query->where('name', 'ilike', "%{$search}%");
          })
          ->get();

      return Inertia::render('companies/dashboard/agent-tours/index', [
          'data' => $tours,
          'filters' => request()->only(['category', 'search']),
      ]);
  }
}
