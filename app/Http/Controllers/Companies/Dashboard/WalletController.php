<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Bavix\Wallet\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalletController extends Controller
{
  public function index(Company $company)
  {
    $wallet = $company->wallet; // default wallet
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

    return Inertia::render('companies/dashboard/wallet/index', [
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

  private function growthPercentage(int $current, int $previous): float
  {
    if ($previous === 0) {
      return $current > 0 ? 100.0 : 0.0;
    }

    return round((($current - $previous) / abs($previous)) * 100, 2);
  }
}
