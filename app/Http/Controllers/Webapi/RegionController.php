<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Resources\RegionResource;
use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class RegionController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getRegions
   */
  public function index(Request $request): JsonResponse
  {
    // Validate query parameters
    $validated = $request->validate([
      'continent_id' => ['nullable', 'integer', 'exists:continents,id'],
      'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
      'page'     => ['nullable', 'integer', 'min:1'],
    ]);

    $perPage = $validated['per_page'] ?? 15; // Changed to more standard 15

    // Build query
    $query = Region::query();

     if (!empty($validated['continent_id'])) {
      $query->where('continent_id', $validated['continent_id']);
    }

    // Order by creation date by default
    $query->orderBy('created_at', 'desc');

    // Paginate
    $regions = $query->paginate($perPage);

    // Return paginated resource
    return RegionResource::collection($regions)->response();
  }

  /**
   * Store a newly created resource in storage.
   * @operationId createRegion
   */
  public function store(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'continent_id' => ['required', 'integer', 'exists:continents,id'],
      'region'        => 'required|string|max:255',
    ]);

    $regions = Region::create($validated);

    return (new RegionResource($regions))
      ->response()
      ->setStatusCode(Response::HTTP_CREATED);
  }

  /**
   * Display the specified resource.
   * @operationId getRegionById
   */
  public function show(string $id): JsonResponse
  {
    $regions = Region::findOrFail($id);

    return (new RegionResource($regions))->response();
  }

  /**
   * Update the specified resource in storage.
   * @operationId updateRegion
   */
  public function update(Request $request, string $id): JsonResponse
  {
    $regions = Region::findOrFail($id);

    $validated = $request->validate([
      'continent_id' => ['sometimes', 'integer', 'exists:continents,id'],
      'region'        => 'sometimes|required|string|max:255',
    ]);

    $regions->update($validated);

    return (new RegionResource($regions))->response();
  }

  /**
   * Remove the specified resource from storage.
   * @operationId deleteRegion
   */
  public function destroy(string $id): JsonResponse
  {
    $regions = Region::findOrFail($id);
    $regions->delete();

    return response()->json(null, Response::HTTP_NO_CONTENT);
  }
}
