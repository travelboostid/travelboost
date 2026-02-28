<?php

namespace App\Http\Controllers\Companies\Web;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Inertia\Inertia;

class CompanyRootController extends Controller
{
  public function showLandingPage()
  {
    $company = request()->attributes->get('tenant');
    $company->load('settings');
    return Inertia::render('companies/landing-page', [
      'company' => $company,
    ]);
  }
}
