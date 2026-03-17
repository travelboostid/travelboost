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

    $tenant = request()->attributes->get('tenant');

    $tours = Tour::where('company_id', $tenant->id)
        //->where('is_published', true)
        ->where('status', 'active')
        ->with('company:id,username,name') // ⭐ penting
        ->latest()
        ->get();

    $categories = TourCategory::all();

    return Inertia::render('tenant/home', [
        'username' => $tenant->username,
        'vendor' => $tenant,
        'company' => $tenant,
        'data' => $tours,
        'categories' => $categories,
        'filters' => [],
        'partnership' => null,
    ]);
  }
}
