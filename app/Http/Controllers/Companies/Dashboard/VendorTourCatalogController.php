<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Models\Company;
use Inertia\Inertia;

class VendorTourCatalogController extends Controller
{
  public function index(Company $company, string $vendor)
  {
    $vendor = Company::where('username', $vendor)->firstOrFail();
    $tours = $vendor->tours()->get()->map(function ($tour) use ($company) {
      $tour->has_copied = $company->agentTours()->where('tour_id', $tour->id)->exists();
      return $tour;
    });

    return Inertia::render('companies/dashboard/vendor-tours/index', [
      'data' => $tours,
    ]);
  }

  public function copy(Company $company, string $vendor, Tour $tour)
  {
    $vendor = Company::where('username', $vendor)->firstOrFail();
    $company->agentTours()->create([
      'tour_id' => $tour->id,
    ]);
    return back();
  }

  public function viewBrochure(string $username, Tour $tour)
  {
    return Inertia::render('companies/dashboard/vendor-tours/view-brochure', [
      'username' => $username,
      'tour' => $tour,
    ]);
  }
}
