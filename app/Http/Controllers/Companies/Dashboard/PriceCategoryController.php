<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\PriceCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PriceCategoryController extends Controller
{
    public function index(Request $request, Company $company): Response
    {
        $categories = PriceCategory::where('company_id', $company->id)
            ->orderBy('id')
            ->get();

        return Inertia::render('companies/dashboard/price-categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request, Company $company)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'room_type' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        PriceCategory::create([
            'company_id' => $company->id,
            'name' => $request->name,
            'room_type' => $request->room_type,
            'description' => $request->description,
        ]);

        return redirect()->back();
    }

    public function update(Request $request, Company $company, PriceCategory $price_category)
    {
        if ($price_category->company_id !== $company->id) {
            abort(404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'room_type' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $price_category->update($request->only('name', 'room_type', 'description'));

        return redirect()->back();
    }

    public function destroy(Company $company, PriceCategory $price_category)
    {
        $price_category->delete();

        return redirect()->back();
    }
}
