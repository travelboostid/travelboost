<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Models\Company;
use App\Models\TourCategory;
use App\Models\VendorAgentPartner;
use Inertia\Inertia;

class VendorTourCatalogController extends Controller
{
  public function index(Company $company, string $username)
  {
    $vendor = Company::where('username', $username)->firstOrFail();
    $categories = TourCategory::where('company_id', $vendor->id)
      ->orderBy('position_no')
      ->get();
    $vendor = Company::where('username', $username)->firstOrFail();
    $tours = $vendor->tours()
      ->when(request('category'), function ($query, $categoryId) {
        $query->where('category_id', $categoryId);
      })
      ->when(request('search'), function ($query, $search) {
        $query->where('name', 'ilike', "%{$search}%");
      })
      ->get()
      ->map(function ($tour) use ($company) {
        $tour->has_copied = $company->agentTours()->where('tour_id', $tour->id)->exists();
        return $tour;
      });

    $partnership = VendorAgentPartner::where('vendor_id', $vendor->id)
      ->where('agent_id', $company->id)
      ->first();

    return Inertia::render('companies/dashboard/vendor-tours/index', [
      'data' => $tours,
      'filters'    => request()->only(['category', 'search']),
      'categories' => $categories,
      'username' => $username,
      'partnership' => $partnership,
      'vendor' => $vendor,
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

  //public function viewBrochure(string $username, Tour $tour)
  public function viewBrochure(Company $company, string $username, Tour $tour)
  {
    return Inertia::render('companies/dashboard/vendor-tours/view-brochure', [
      'username' => $username,
      'tour' => $tour,
    ]);
  }

  public function viewPublicBrochure($vendor, $tourId)
  {
      $tour = Tour::with('document')->findOrFail($tourId);
      //
      if (!$tour->document) {
          abort(404);
      }

      $url = $tour->document['data']['url'] ?? null;

      if (!$url) {
          abort(404);
      }

      return redirect($url);
  }
}
