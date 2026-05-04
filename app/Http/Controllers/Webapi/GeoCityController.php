<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Resources\GeoCityResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\Province;


class GeoCityController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getGeoCities
   */
  public function index(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'province_id' => ['required', "exists:" . config('laravolt.indonesia.table_prefix') . "provinces,id"],
    ]);

    $province = Province::findOrFail($validated['province_id']);
    $cities = $province->cities()->orderBy('name')->get();
    return GeoCityResource::collection($cities)->response();
  }
}
