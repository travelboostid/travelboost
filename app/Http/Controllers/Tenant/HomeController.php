<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

use App\Models\Tour;
use App\Models\TourCategory;

class HomeController extends Controller
{
  public function index()
  {
    /*$tenant = request()->attributes->get('tenant');
    $tenant->load('settings');
    return Inertia::render('companies/landing-page', [
      'company' => $tenant,
    ]);*/

    /*$tenant = request()->attributes->get('tenant');

    return Inertia::render('companies/dashboard/vendor-tours/index', [
        'username' => $tenant->username,
        'data' => [],        // sementara kosong
        'categories' => [],
        'filters' => [],
        'vendor' => $tenant,
        'partnership' => null,
        'company' => $tenant,
    ]);*/

    //////////////////////////////////////

    /*$tenant = request()->attributes->get('tenant');

    $tours = Tour::where('company_id', $tenant->id)
        //->where('is_published', true)
        ->where('status', 'active')
        ->with('company:id,username,name') // ⭐ penting
        ->latest()
        ->get();

    //$categories = TourCategory::all();
    $categories = TourCategory::where('company_id', $tenant->id)
    ->orderBy('name')
    ->get();

    return Inertia::render('tenant/home', [
        'username' => $tenant->username,
        'vendor' => $tenant,
        'company' => $tenant,
        'data' => $tours,
        'categories' => $categories,
        'filters' => [],
        'partnership' => null,
    ]); */

    $tenant = request()->attributes->get('tenant');

    // 🏢 Tour milik vendor
    $ownTours = Tour::where('company_id', $tenant->id)
        ->where('status', 'active')
        ->with('company:id,username,name')
        ->get();

    // 🤝 Tour dari agent
    /*$agentTours = \App\Models\AgentTour::where('company_id', $tenant->id)
        ->with('tour.company:id,username,name')
        ->get()
        ->pluck('tour')
        ->filter();*/
    
    $agentTours = \App\Models\AgentTour::where('company_id', $tenant->id)
        ->whereHas('tour', function ($q) {
            $q->where('status', 'active');
        })
        ->with(['tour' => function ($q) {
            $q->where('status', 'active')
              ->with('company:id,username,name');
        }])
        ->get()
        ->pluck('tour')
        ->filter();

    // 🔥 Gabungkan
    $tours = $ownTours
        ->merge($agentTours)
        ->unique('id')
        ->sortByDesc('created_at')
        ->values();

    // 📂 Kategori milik tenant
    $categories = TourCategory::where('company_id', $tenant->id)
        ->orderBy('position_no')
        ->get();

    // 📱 Phone vendor
    $phone = $tenant->customer_service_phone ?: $tenant->phone;

    return Inertia::render('tenant/home', [
        'username' => $tenant->username,
        'vendor' => $tenant,
        'company' => $tenant,
        'data' => $tours,
        'categories' => $categories,
        'filters' => [],
        'partnership' => null,
        'phone' => $phone,
    ]);
  }
}
