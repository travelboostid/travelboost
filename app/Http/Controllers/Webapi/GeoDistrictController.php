<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Resources\GeoDistrictResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;

class GeoDistrictController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getGeoDistricts
   */
  public function index(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'city_id' => 'required|exists:' . config('laravolt.indonesia.table_prefix') . 'cities,id',
    ]);

    $city = City::findOrFail($validated['city_id']);
    $districts = $city->districts()->orderBy('name')->get();
    return GeoDistrictResource::collection($districts)->response();
  }
}
