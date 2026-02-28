<?php

namespace App\Http\Controllers\Companies\Web;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Inertia\Inertia;

class CompanyPublicController extends Controller
{
  public function showLandingPage(Company $company)
  {
    $company->load('settings');
    return Inertia::render('companies/landing-page', [
      'company' => $company,
    ]);
  }


  public function editLandingPage(Company $company)
  {
    $company->load('settings');
    return Inertia::render('companies/edit-landing-page', [
      'company' => $company,
    ]);
  }

  public function showTours(Company $company)
  {
    $company->load('agentTours');
    return Inertia::render('companies/tours', [
      'company' => $company,
    ]);
  }
}
