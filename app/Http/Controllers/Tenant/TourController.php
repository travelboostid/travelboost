<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Inertia\Inertia;

class TourController extends Controller
{
  public function index()
  {
    $tenant = request()->attributes->get('tenant');
    $tenant->load('agentTours');
    return Inertia::render('companies/agent-tours', [
      'data' => $tenant->agentTours,
    ]);
  }
}
