<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Events\TourCreated;
use App\Events\TourUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourRequest;
use App\Http\Requests\UpdateTourRequest;
use App\Http\Resources\TourResource;
use App\Models\Tour;
use App\Models\Company;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TourController extends Controller
{
  public function index(Company $company)
  {
    $tours = $company->tours()->get();
    return Inertia::render('companies/dashboard/tours/index', [
      'data' => $tours,
    ]);
  }

  public function create(Company $company)
  {
    return Inertia::render('companies/dashboard/tours/create');
  }

  public function store(StoreTourRequest $request, Company $company)
  {
    $tour = $company->tours()->create($request->validated());
    // TourCreated::dispatch($tour);
    return back();
  }

  public function edit(Company $company, Tour $tour)
  {
    return Inertia::render('companies/dashboard/tours/edit', [
      'tour' => $tour,
    ]);
  }

  public function update(UpdateTourRequest $request, Company $company, Tour $tour)
  {
    $tour->update($request->validated());
    TourUpdated::dispatch($tour);
    return back();
  }

  public function destroy(Company $company, Tour $tour)
  {
    $tour->delete();
    return back();
  }
}
