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
   * @operationId getTours
   */
  public function index(TourIndexRequest $request): JsonResponse
  {
    $perPage = $request->get('per_page', 10);
    $tours = Tour::paginate($perPage);

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
