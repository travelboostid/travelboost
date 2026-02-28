<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\TourIndexRequest;
use App\Http\Resources\TourResource;
use App\Models\Tour;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class TourController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getTrips
   */
  public function index(TourIndexRequest $request): JsonResponse
  {
    $tours = Tour::query()
      ->when($request->company_id, function ($q) use ($request) {
        $q->where('company_id', $request->company_id);
      })
      ->when($request->category_id, function ($q) use ($request) {
        $q->where('category_id', $request->category_id);
      })
      ->when($request->duration_min, function ($q) use ($request) {
        $q->where('duration', '>=', $request->duration_min);
      })
      ->when($request->duration_max, function ($q) use ($request) {
        $q->where('duration', '<=', $request->duration_max);
      })
      ->orderBy($request->sort_by, $request->sort_order)
      ->paginate();

    return TourResource::collection($tours)->response();
  }

  /**
   * Display a item of the resource.
   * @operationId getTour
   */
  public function show(Tour $tour): JsonResponse
  {
    $tour->increment('view_count');
    return TourResource::make($tour)->response();
  }
}
