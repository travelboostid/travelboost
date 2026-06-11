<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\TourCategoryIndexRequest;
use App\Http\Resources\TourCategoryResource;
use App\Models\TourCategory;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TourCategoryController extends Controller
{
    /**
     * List tour categories for a company.
     *
     * @operationId getTourCategories
     */
    public function index(TourCategoryIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();

        $categories = TourCategory::query()
            ->when($validated['company_id'] ?? null, function ($q) use ($validated) {
                $q->where('company_id', $validated['company_id']);
            })
            ->orderBy($validated['sort_by'], $validated['sort_order'])
            ->paginate();

        return TourCategoryResource::collection($categories);
    }
}
