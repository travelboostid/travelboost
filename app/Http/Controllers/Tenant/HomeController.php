<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class HomeController extends Controller
{
  public function index()
  {
    $tenant = request()->attributes->get('tenant');
    $tenant->load('settings');
    return Inertia::render('companies/landing-page', [
      'company' => $tenant,
    ]);
  }
}
