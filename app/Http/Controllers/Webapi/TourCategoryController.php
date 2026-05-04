<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\TourCategoryIndexRequest;
use App\Http\Resources\TourCategoryResource;
use App\Models\TourCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class TourCategoryController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getTourCategories
   */
  public function index(TourCategoryIndexRequest $request): JsonResponse
  {
    $validated = $request->validated();

    // Build query
    $categories = TourCategory::query()
      ->when($validated['company_id'] ?? null, function ($q) use ($validated) {
        $q->where('company_id', $validated['company_id']);
      })
      ->orderBy($validated['sort_by'], $validated['sort_order'])
      ->paginate();
    // Return paginated resource
    return TourCategoryResource::collection($categories)->response();
  }
}
