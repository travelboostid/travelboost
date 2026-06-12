<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyType;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\VisaCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class VisaCategoryController extends Controller
{
    public function index(Company $company): Response
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);

        return Inertia::render('companies/dashboard/visa-categories/index', [
            'visaCategories' => $company->visaCategories()
                ->with('items')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request, Company $company): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);

        $data = $this->validatePayload($request, $company);

        DB::transaction(function () use ($company, $data): void {
            $category = $company->visaCategories()->create([
                'name' => $data['name'],
                'slug' => $this->makeUniqueSlug($company, $data['name']),
            ]);

            $category->items()->createMany($this->formatItems($data['items']));
        });

        return back();
    }

    public function update(Request $request, Company $company, VisaCategory $visa_category): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);
        abort_unless($visa_category->company_id === $company->id, 404);

        $data = $this->validatePayload($request, $company, $visa_category);

        DB::transaction(function () use ($visa_category, $company, $data): void {
            $visa_category->update([
                'name' => $data['name'],
                'slug' => $this->makeUniqueSlug($company, $data['name'], $visa_category->id),
            ]);

            $visa_category->items()->delete();
            $visa_category->items()->createMany($this->formatItems($data['items']));
        });

        return back();
    }

    public function destroy(Company $company, VisaCategory $visa_category): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);
        abort_unless($visa_category->company_id === $company->id, 404);

        if ($visa_category->tours()->exists()) {
            return back()->withErrors([
                'delete_error' => 'This visa category is already used by a tour. Remove it from the tour first.',
            ]);
        }

        $visa_category->delete();

        return back();
    }

    /**
     * @return array{name:string,items:array<int,array{description:string,price:numeric-string|int|float,is_taxable:bool}>}
     */
    private function validatePayload(Request $request, Company $company, ?VisaCategory $visaCategory = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.is_taxable' => ['nullable', 'boolean'],
        ]);

        $slug = Str::slug($validated['name']);

        $exists = $company->visaCategories()
            ->where('slug', $slug)
            ->when($visaCategory, fn ($query) => $query->whereKeyNot($visaCategory->id))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'name' => 'This visa category already exists.',
            ]);
        }

        return $validated;
    }

    /**
     * @param  array<int,array{description:string,price:numeric-string|int|float,is_taxable:bool|null}>  $items
     * @return array<int,array{description:string,price:float,is_taxable:bool,sort_order:int}>
     */
    private function formatItems(array $items): array
    {
        return collect($items)
            ->values()
            ->map(function (array $item, int $index): array {
                return [
                    'description' => $item['description'],
                    'price' => (float) $item['price'],
                    'is_taxable' => (bool) ($item['is_taxable'] ?? false),
                    'sort_order' => $index,
                ];
            })
            ->all();
    }

    private function makeUniqueSlug(Company $company, string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 2;

        while ($company->visaCategories()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
