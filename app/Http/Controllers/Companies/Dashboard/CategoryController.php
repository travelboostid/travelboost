<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourCategoryRequest;
use App\Http\Requests\UpdateTourCategoryRequest;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourCategory;
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
        $exists = TourCategory::query()
            ->where('company_id', $company->id)
            ->whereRaw('LOWER(name) = ?', [strtolower($request->name)])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'name' => 'Category name already exists for this company.',
            ]);
        }

        $company->tourCategories()->create($request->validated());

        return redirect()->back();
    }

    public function update(UpdateTourCategoryRequest $request, Company $company, TourCategory $category)
    {
        $category->update($request->validated());

        return redirect()->back();
    }

    public function destroy(Company $company, TourCategory $category)
    {
        $usedInTours = Tour::query()
            ->where('category_id', $category->id)
            ->exists();

        if ($usedInTours) {
            return back()->withErrors([
                'delete_error' => 'Category cannot be deleted because it is already used by tours.',
            ]);
        }

        $category->delete();

        return redirect()->back();
    }
}
