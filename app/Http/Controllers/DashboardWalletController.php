<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Bavix\Wallet\Models\Transaction;
use Bavix\Wallet\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Midtrans\Snap;

class DashboardWalletController extends Controller
{
  /** Display a listing of the resource.
   */
  public function show()
  {
    $user = Auth::user();
    $wallet = $user->wallet; // default wallet
    // Current balance
    $balance = $wallet->balance;

    $thisMonthStart = now()->startOfMonth();
    $thisMonthEnd   = now()->endOfMonth();

    $lastMonthStart = now()->subMonth()->startOfMonth();
    $lastMonthEnd   = now()->subMonth()->endOfMonth();

    // --- THIS MONTH ---
    $thisIncome = $wallet->transactions()
      ->where('amount', '>', 0)
      ->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])
      ->sum('amount');

    $thisExpense = abs(
      $wallet->transactions()
        ->where('amount', '<', 0)
        ->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])
        ->sum('amount')
    );

    // --- LAST MONTH ---
    $lastIncome = $wallet->transactions()
      ->where('amount', '>', 0)
      ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
      ->sum('amount');

    $lastExpense = abs(
      $wallet->transactions()
        ->where('amount', '<', 0)
        ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
        ->sum('amount')
    );

    // Net movement
    $thisNet = $thisIncome - $thisExpense;
    $lastNet = $lastIncome - $lastExpense;

    // Last 10 transactions
    $transactions = $wallet->transactions()
      ->latest()
      ->take(10)
      ->get()
      ->map(fn(Transaction $t) => [
        'id'        => $t->id,
        'type'      => $t->amount > 0 ? 'income' : 'expense',
        'amount'    => $t->amount,
        'confirmed' => $t->confirmed,
        'meta'      => $t->meta,
        'created_at' => $t->created_at,
      ]);

    return Inertia::render('dashboard/wallet/index', [
      'balance' => $balance,
      'income' => [
        'this_month' => $thisIncome,
        'last_month' => $lastIncome,
        'growth_pct' => $this->growthPercentage($thisIncome, $lastIncome),
      ],
      'expenses' => [
        'this_month' => $thisExpense,
        'last_month' => $lastExpense,
        'growth_pct' => $this->growthPercentage($thisExpense, $lastExpense),
      ],
      'net_change' => [
        'this_month' => $thisNet,
        'last_month' => $lastNet,
        'growth_pct' => $this->growthPercentage($thisNet, $lastNet),
      ],
      'transactions' => $transactions,
    ]);
  }

  // public function topup(Request $request)
  // {
  //   $request->validate([
  //     'amount' => 'required|numeric|min:100000',
  //   ]);

  //   $user = Auth::user();

  //   /**
  //    * ------------------------------------------------------
  //    * Create payment record (source of truth)
  //    * ------------------------------------------------------
  //    */
  //   $payment = Payment::create([
  //     'user_id' => $user->id,
  //     'provider' => 'midtrans',
  //     'amount' => $request->amount,
  //     'status' => 'unpaid',
  //   ]);

  //   /**
  //    * ------------------------------------------------------
  //    * Create Midtrans Snap transaction
  //    * ------------------------------------------------------
  //    */
  //   $params = [
  //     'transaction_details' => [
  //       'order_id' => 'TOPUP-' . $payment->id . '-' . Str::random(6),
  //       'gross_amount' => (int) $payment->amount,
  //     ],
  //     'customer_details' => [
  //       'first_name' => $user->name,
  //       'email' => $user->email,
  //     ],
  //     'callbacks' => [
  //       'finish' => config('app.url') . '/dashboard/wallet',
  //     ],
  //   ];

  //   $snapToken = Snap::getSnapToken($params);

  //   /**
  //    * ------------------------------------------------------
  //    * Save initial payload
  //    * ------------------------------------------------------
  //    */
  //   $payment->update([
  //     'payload' => [
  //       'snap_token' => $snapToken,
  //       'request' => $params,
  //     ],
  //   ]);

  //   return response()->json($payment->fresh());
  // }

  private function growthPercentage(int $current, int $previous): float
  {
    if ($previous === 0) {
      return $current > 0 ? 100.0 : 0.0;
    }

    return round((($current - $previous) / abs($previous)) * 100, 2);
  }
}
