<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Inertia\Inertia;
use App\Models\TourCategory;

class TourController extends Controller
{
  public function index()
  {
    $tenant = request()->attributes->get('tenant');
    $tenant->load(['agentTours.tour.company', 'settings']);
    $categories = TourCategory::where('company_id', $tenant->id)
        ->orderBy('position_no')
        ->get();
    $phone = $tenant->customer_service_phone ?: $tenant->phone;

    return Inertia::render('companies/agent-tours', [
      'data' => $tenant->agentTours,
      
      'company'    => $tenant,
      'vendor'     => $tenant,
      'username'   => $tenant->username,
      'categories' => $categories,
      'phone'      => $phone,
    ]);
  }
}