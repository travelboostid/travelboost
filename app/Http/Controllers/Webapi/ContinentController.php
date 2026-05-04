<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContinentResource;
use App\Models\Continent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ContinentController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getContinents
   */
  public function index(Request $request): JsonResponse
  {
    // Validate query parameters
    $validated = $request->validate([
      'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
      'page'     => ['nullable', 'integer', 'min:1'],
    ]);

    $perPage = $validated['per_page'] ?? 15; // Changed to more standard 15

    // Build query
    $query = Continent::query();

    /* if (!empty($validated['user_id'])) {
      $query->where('user_id', $validated['user_id']);
    }*/

    // Order by creation date by default
    $query->orderBy('created_at', 'desc');

    // Paginate
    $continents = $query->paginate($perPage);

    // Return paginated resource
    return ContinentResource::collection($continents)->response();
  }

  /**
   * Store a newly created resource in storage.
   * @operationId createContinent
   */
  public function store(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'name'        => 'required|string|max:255',
    ]);

    $continents = Continent::create($validated);

    return (new ContinentResource($continents))
      ->response()
      ->setStatusCode(Response::HTTP_CREATED);
  }

  /**
   * Display the specified resource.
   * @operationId getContinentById
   */
  public function show(string $id): JsonResponse
  {
    $continents = Continent::findOrFail($id);

    return (new ContinentResource($continents))->response();
  }

  /**
   * Update the specified resource in storage.
   * @operationId updateContinent
   */
  public function update(Request $request, string $id): JsonResponse
  {
    $continents = Continent::findOrFail($id);

    $validated = $request->validate([
      'name'        => 'sometimes|required|string|max:255',
    ]);

    $continents->update($validated);

    return (new ContinentResource($continents))->response();
  }

  /**
   * Remove the specified resource from storage.
   * @operationId deleteContinent
   */
  public function destroy(string $id): JsonResponse
  {
    $continents = Continent::findOrFail($id);
    $continents->delete();

    return response()->json(null, Response::HTTP_NO_CONTENT);
  }
}
