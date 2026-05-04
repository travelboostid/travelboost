<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\BankAccountIndexRequest;
use App\Http\Resources\BankAccountResource;
use App\Models\BankAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BankAccountController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getBankAccounts
   */
  public function index(BankAccountIndexRequest $request): JsonResponse
  {
    $bankAccounts = BankAccount::query()
      ->when($request->input('owner_type'), function ($query, $ownerType) {
        $query->where('owner_type', $ownerType);
      })
      ->when($request->input('owner_id'), function ($query, $ownerId) {
        $query->where('owner_id', $ownerId);
      })
      ->get();

    return response()->json([
      'success' => true,
      'data' => BankAccountResource::collection($bankAccounts)
    ]);
  }
}
