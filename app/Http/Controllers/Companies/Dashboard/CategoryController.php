<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Events\TourCreated;
use App\Events\TourUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourCategoryRequest;
use App\Http\Requests\UpdateTourCategoryRequest;
use App\Models\TourCategory;
use App\Models\Company;
use Inertia\Inertia;

class CategoryController extends Controller
{
  public function index(Company $company)
  {
    $tours = TourCategory::query()
      ->where('company_id', $company->id)
      ->latest()
      ->get();

    return Inertia::render('companies/dashboard/categories/index', [
      'data' => $tours,
    ]);
  }

  public function store(StoreTourCategoryRequest $request, Company $company)
  {
    $company->tourCategories()->create($request->validated());

    return back();
  }

  public function update(UpdateTourCategoryRequest $request, Company $company, TourCategory $category)
  {
    $category->update($request->validated());
    return back();
  }

  public function destroy(Company $company, TourCategory $category)
  {
    $category->delete();
    return back();
  }
}
