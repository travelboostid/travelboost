<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Inertia\Inertia;

class HomeController extends Controller
{
  public function index(Company $company)
  {
    return Inertia::render('companies/dashboard/home', [
      'data' => [],
    ]);
  }
}
