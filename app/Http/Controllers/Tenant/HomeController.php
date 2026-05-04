<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AgentTour;
use App\Models\AffiliateProfile;
use App\Models\TourCategory;
use App\Models\Tour;
use Inertia\Inertia;

class HomeController extends Controller
{
  public function index()
  {
    $tenant = request()->attributes->get('tenant');

    // Guard: jika tenant bukan Company (e.g. affiliator), bail out
    if (!$tenant || $tenant instanceof AffiliateProfile) {
      abort(404);
    }

    $tenant->load('settings');

    // Jika vendor punya custom landing page, render langsung
    if ($tenant->settings && !empty($tenant->settings->landing_page_data)) {
      return Inertia::render('companies/landing-page', [
        'company' => $tenant,
      ]);
    }

    // Tour milik vendor sendiri
    $ownTours = Tour::where('company_id', $tenant->id)
      ->where('status', 'active')
      ->with('company:id,username,name')
      ->get();

    // Tour dari agent
    $agentTours = AgentTour::where('company_id', $tenant->id)
      ->whereHas('tour', fn($q) => $q->where('status', 'active'))
      ->with(['tour' => fn($q) => $q->where('status', 'active')->with('company:id,username,name')])
      ->get()
      ->pluck('tour')
      ->filter();

    $tours = $ownTours
      ->merge($agentTours)
      ->unique('id')
      ->sortByDesc('created_at')
      ->values();

    $categories = TourCategory::where('company_id', $tenant->id)
      ->orderBy('position_no')
      ->get();

    $phone = $tenant->customer_service_phone ?: $tenant->phone;

    return Inertia::render('tenant/home', [
      'username'    => $tenant->username,
      'vendor'      => $tenant,
      'company'     => $tenant,
      'data'        => $tours,
      'categories'  => $categories,
      'filters'     => [],
      'partnership' => null,
      'phone'       => $phone,
    ]);
  }
}
