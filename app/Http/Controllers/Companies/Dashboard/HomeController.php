<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Resources\TourResource;
use App\Models\Tour;
use App\Models\Company;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HomeController extends Controller
{
  public function index(Company $company)
  {
    return Inertia::render('companies/dashboard/home', [
      'data' => TourResource::collection(
        Tour::with(['user', 'category'])
          ->where('user_id', Auth::id())
          ->latest()
          ->get()
      ),
    ]);
  }
}
