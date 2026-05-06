<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AgentTour;
use App\Models\AffiliateProfile;
use App\Models\TourCategory;
use App\Models\Tour;
use Illuminate\Support\Facades\Context;
use Inertia\Inertia;

class HomeController extends Controller
{
  public function index()
  {
    $domain = Context::get('domain');
    $company = $domain?->owner;

    // Guard: jika tenant bukan Company (e.g. affiliator), bail out
    if (!$company || $company instanceof AffiliateProfile) {
      abort(404);
    }

    $company->load('settings');

    // Jika vendor punya custom landing page, render langsung
    if ($company->settings && !empty($company->settings->landing_page_data)) {
      return Inertia::render('companies/landing-page', [
        'company' => $company,
      ]);
    }
    return redirect()->route('tours');
  }
}
