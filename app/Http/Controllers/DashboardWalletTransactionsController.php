<?php

namespace App\Http\Controllers;

use Bavix\Wallet\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardWalletTransactionsController extends Controller
{
  public function index(Request $request)
  {
    $user = Auth::user();
    $wallet = $user->wallet;

    /**
     * ------------------------------------------------------
     * Date range (optional)
     * default = last 1 month
     * ------------------------------------------------------
     */
    $from = $request->input('from')
      ? Carbon::parse($request->input('from'))->startOfDay()
      : now()->subMonth()->startOfDay();

    $to = $request->input('to')
      ? Carbon::parse($request->input('to'))->endOfDay()
      : now()->endOfDay();

    /**
     * ------------------------------------------------------
     * Base query
     * ------------------------------------------------------
     */
    $query = $wallet->transactions()
      ->whereBetween('created_at', [$from, $to]);

    /**
     * ------------------------------------------------------
     * Aggregates
     * ------------------------------------------------------
     */
    $transactionCount = (clone $query)->count();

    $incomeAmount = (clone $query)
      ->where('amount', '>', 0)
      ->sum('amount');

    $expenseAmount = abs(
      (clone $query)
        ->where('amount', '<', 0)
        ->sum('amount')
    );

    /**
     * ------------------------------------------------------
     * Transactions list
     * ------------------------------------------------------
     */
    $transactions = (clone $query)
      ->latest()
      ->take(50)
      ->get()
      ->map(fn(Transaction $t) => [
        'id' => $t->id,
        'type' => $t->amount > 0 ? 'income' : 'expense',
        'amount' => abs($t->amount),
        'meta' => $t->meta,
        'confirmed' => $t->confirmed,
        'created_at' => $t->created_at,
      ]);

    return Inertia::render('dashboard/wallet-transactions/index', [
      'from' => $from->toDateString(),
      'to' => $to->toDateString(),
      'transaction_count' => $transactionCount,
      'income_amount' => $incomeAmount,
      'expense_amount' => $expenseAmount,
      'transactions' => $transactions,
    ]);
  }
}
