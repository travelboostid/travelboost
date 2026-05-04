<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Resources\WalletResource;
use Bavix\Wallet\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WalletController extends Controller
{
  public function index(Request $request)
  {
    // Get the authenticated user
    $user = Auth::user();

    // Start building query
    $wallets = Wallet::query()
      ->when(
        $request->filled('user_id'),
        fn($q) => $q->where('user_id', $request->user_id)
      )
      ->when(
        $request->filled('status'),
        fn($q) => $q->where('status', $request->status)
      )->latest()
      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    return WalletResource::collection($wallets);
  }
}
