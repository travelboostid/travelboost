<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentIndexRequest;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\WithdrawalResource;
use App\Models\Payment;
use App\Models\WalletTopup;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Midtrans\Snap;

class WithdrawalController extends Controller
{
  /**
   * get payment list
   *
   * @operationId getWithdrawals
   */
  public function index(PaymentIndexRequest $request)
  {
    $withdrawals = Withdrawal::query()
      ->where('user_id', Auth::id())

      ->when(
        $request->filled('status'),
        fn($q) => $q->where('status', $request->status)
      )

      ->when(
        $request->filled('from'),
        fn($q) => $q->whereDate('created_at', '>=', $request->from)
      )

      ->when(
        $request->filled('to'),
        fn($q) => $q->whereDate('created_at', '<=', $request->to)
      )

      ->latest()
      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    return WithdrawalResource::collection($withdrawals);
  }
}
