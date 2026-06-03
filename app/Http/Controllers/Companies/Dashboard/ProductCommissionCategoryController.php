<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyType;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\ProductCommissionCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductCommissionCategoryController extends Controller
{
    public function index(Company $company): Response
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);

        return Inertia::render('companies/dashboard/product-commission-categories/index', [
            'categories' => $company->productCommissionCategories()
                ->orderBy('sort_order')
                ->orderBy('category_name')
                ->get(),
        ]);
    }

    public function store(Request $request, Company $company): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $slug = Str::slug($data['name']);
        $exists = $company->productCommissionCategories()->where('slug', $slug)->exists();

        if ($exists) {
            return back()->withErrors(['name' => 'This category already exists.']);
        }

        $company->productCommissionCategories()->create([
            'category_name' => $data['name'],
            'slug' => $slug,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return back();
    }

    public function update(Request $request, Company $company, ProductCommissionCategory $product_commission_category): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);
        abort_unless($product_commission_category->company_id === $company->id, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $slug = Str::slug($data['name']);
        $exists = $company->productCommissionCategories()
            ->where('slug', $slug)
            ->whereKeyNot($product_commission_category->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['name' => 'This category already exists.']);
        }

        $product_commission_category->update([
            'category_name' => $data['name'],
            'slug' => $slug,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return back();
    }

    public function destroy(Company $company, ProductCommissionCategory $product_commission_category): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);
        abort_unless($product_commission_category->company_id === $company->id, 404);

        $isUsed = $product_commission_category->tours()->exists() || $product_commission_category->commissionRules()->exists();

        if ($isUsed) {
            return back()->withErrors([
                'delete_error' => 'This category is already used. Deactivate it instead.',
            ]);
        }

        $product_commission_category->delete();

        return back();
    }
}
