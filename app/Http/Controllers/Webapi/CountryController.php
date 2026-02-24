<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Resources\CountryResource;
use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CountryController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getCountries
   */
  public function index(Request $request): JsonResponse
  {
    // Validate query parameters
    $validated = $request->validate([
      'continent_id' => ['nullable', 'integer', 'exists:continents,id'],
      'region_id' => ['nullable', 'integer', 'exists:regions,id'],
      'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
      'page'     => ['nullable', 'integer', 'min:1'],
    ]);

    $perPage = $validated['per_page'] ?? 15; // Changed to more standard 15

    // Build query
    $query = Country::query();

    if (!empty($validated['continent_id'])) {
      $query->where('continent_id', $validated['continent_id']);
    }

    if (!empty($validated['region_id'])) {
      $query->where('region_id', $validated['region_id']);
    }

    // Order by creation date by default
    $query->orderBy('created_at', 'desc');

    // Paginate
    $countries = $query->paginate($perPage);

    // Return paginated resource
    return CountryResource::collection($countries)->response();
  }

  /**
   * Store a newly created resource in storage.
   * @operationId createCountry
   */
  public function store(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'continent_id' => ['required', 'integer', 'exists:continents,id'],
      'region_id' => ['required', 'integer', 'exists:regions,id'],
      'country'        => 'required|string|max:255',
    ]);

    $countries = Country::create($validated);

    return (new CountryResource($countries))
      ->response()
      ->setStatusCode(Response::HTTP_CREATED);
  }

  /**
   * Display the specified resource.
   * @operationId getCountryById
   */
  public function show(string $id): JsonResponse
  {
    $countries = Country::findOrFail($id);

    return (new CountryResource($countries))->response();
  }

  /**
   * Update the specified resource in storage.
   * @operationId updateCountry
   */
  public function update(Request $request, string $id): JsonResponse
  {
    $countries = Country::findOrFail($id);

    $validated = $request->validate([
      'continent_id' => ['sometimes', 'integer', 'exists:continents,id'],
      'region_id' => ['sometimes', 'integer', 'exists:regions,id'],
      'country'        => 'sometimes|required|string|max:255',
    ]);

    $countries->update($validated);

    return (new CountryResource($countries))->response();
  }

  /**
   * Remove the specified resource from storage.
   * @operationId deleteCountry
   */
  public function destroy(string $id): JsonResponse
  {
    $countries = Country::findOrFail($id);
    $countries->delete();

    return response()->json(null, Response::HTTP_NO_CONTENT);
  }
}
