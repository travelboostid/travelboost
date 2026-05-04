<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Resources\GeoProvinceResource;
use Illuminate\Http\JsonResponse;
use Laravolt\Indonesia\Models\Province;

class GeoProvinceController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getGeoProvinces
   */
  public function index(): JsonResponse
  {
    $provinces = Province::orderBy('name', 'desc')->get();
    return GeoProvinceResource::collection($provinces)->response();
  }
}
