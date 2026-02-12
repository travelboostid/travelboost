<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Resources\BankAccountResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BankAccountController extends Controller
{
  /**
   * Display a listing of the resource.
   * @operationId getBankAccounts
   */
  public function index(): JsonResponse
  {
    $bankAccounts = Auth::user()->bankAccounts()->get();

    return response()->json([
      'success' => true,
      'data' => BankAccountResource::collection($bankAccounts)
    ]);
  }
}
