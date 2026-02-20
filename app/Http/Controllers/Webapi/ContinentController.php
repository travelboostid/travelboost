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
   * @operationId getTourCategories
   */
  public function index(Request $request): JsonResponse
  {
    // Validate query parameters
    $validated = $request->validate([
      'user_id'  => ['nullable', 'integer', 'exists:users,id'],
      'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
      'page'     => ['nullable', 'integer', 'min:1'],
    ]);

    $perPage = $validated['per_page'] ?? 15; // Changed to more standard 15

    // Build query
    $query = Continent::query();

    if (!empty($validated['user_id'])) {
      $query->where('user_id', $validated['user_id']);
    }

    // Order by creation date by default
    $query->orderBy('created_at', 'desc');

    // Paginate
    $categories = $query->paginate($perPage);

    // Return paginated resource
    return ContinentResource::collection($categories)->response();
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'continent'        => 'required|string|max:255',
      'user_id'     => 'sometimes|nullable|integer|exists:users,id', // Added user_id validation
    ]);

    $category = Continent::create($validated);

    return (new ContinentResource($category))
      ->response()
      ->setStatusCode(Response::HTTP_CREATED);
  }

  /**
   * Display the specified resource.
   */
  public function show(string $id): JsonResponse
  {
    $category = Continent::findOrFail($id);

    return (new ContinentResource($category))->response();
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, string $id): JsonResponse
  {
    $category = Continent::findOrFail($id);

    $validated = $request->validate([
      'continent'        => 'sometimes|required|string|max:255',
      'user_id'     => 'sometimes|nullable|integer|exists:users,id',
    ]);

    $category->update($validated);

    return (new ContinentResource($category))->response();
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(string $id): JsonResponse
  {
    $category = Continent::findOrFail($id);
    $category->delete();

    return response()->json(null, Response::HTTP_NO_CONTENT);
  }
}
