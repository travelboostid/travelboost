<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class WalletTransactionsController extends Controller
{
  public function index(Request $request)
  {
    $wallet = $request->user()->wallet;

    $from = $request->input('from') ? Carbon::parse($request->input('from'))->startOfDay() : now()->subMonth()->startOfDay();
    $to = $request->input('to') ? Carbon::parse($request->input('to'))->endOfDay() : now()->endOfDay();

    // ====================================================================
    // [DEPLOYMENT] UNCOMMENT BLOK INI
    // ====================================================================
    /*
        $query = $wallet->transactions()->whereBetween('created_at', [$from, $to]);

        $transactions = (clone $query)->latest()->take(50)->get();

        return Inertia::render('affiliate/dashboard/fund/transactions/index', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'transaction_count' => (clone $query)->count(),
            'income_amount' => (clone $query)->where('amount', '>', 0)->sum('amount'),
            'expense_amount' => abs((clone $query)->where('amount', '<', 0)->sum('amount')),
            'transactions' => $transactions,
        ]);
        */

    // [DUMMY]
    return Inertia::render('affiliate/dashboard/fund/transactions/index', [
      'from' => $from->toDateString(),
      'to' => $to->toDateString(),
      'transaction_count' => 0,
      'income_amount' => 0,
      'expense_amount' => 0,
      'transactions' => [],
    ]);
  }
}
