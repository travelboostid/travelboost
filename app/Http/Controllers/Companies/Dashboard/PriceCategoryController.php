<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Company;
use App\Models\PriceCategory;

class PriceCategoryController extends Controller
{
    public function index(Request $request, Company $company)
    {
        $categories = PriceCategory::where('company_id', $company->id)
            ->latest()
            ->get();

        return Inertia::render('companies/dashboard/price-categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request, Company $company)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        PriceCategory::create([
            'company_id' => $company->id,
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return back();
    }

    public function update(Request $request, Company $company, PriceCategory $price_category)
    {
        if ($price_category->company_id !== $company->id) {
            abort(404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $price_category->update($request->only('name', 'description'));

        return back();
    }

    public function destroy(Company $company, PriceCategory $price_category)
    {
        $price_category->delete();
        return back();
    }
}