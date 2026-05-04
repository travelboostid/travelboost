<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Resources\GeoVillageResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Village;

class GeoVillageController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getGeoVillages
   */
  public function index(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'district_id' => 'required|exists:' . config('laravolt.indonesia.table_prefix') . 'districts,id',
    ]);

    $district = District::findOrFail($validated['district_id']);
    $villages = $district->villages()->orderBy('name')->get();
    return GeoVillageResource::collection($villages)->response();
  }
}
