<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\AiModelIndexRequest;
use App\Http\Resources\AiModelResource;
use App\Models\AiModel;
use Illuminate\Http\JsonResponse;

class AiModelController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getAiModels
   */
  public function index(AiModelIndexRequest $request): JsonResponse
  {
    $validated = $request->validated();

    // Build query
    $categories = AiModel::query()
      ->orderBy($validated['sort_by'], $validated['sort_order'])
      ->paginate();
    // Return paginated resource
    return AiModelResource::collection($categories)->response();
  }
}
