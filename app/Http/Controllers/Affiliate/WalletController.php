<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Withdrawal;

class WalletController extends Controller
{
  public function index(Request $request)
  {
    $user = $request->user();

    // ====================================================================
    // [DEPLOYMENT] UNCOMMENT BLOK INI
    // ====================================================================
    /*
        $wallet = $user->wallet; 
        $balance = $wallet->balance;

        $thisMonthStart = now()->startOfMonth();
        $thisMonthEnd   = now()->endOfMonth();
        $lastMonthStart = now()->subMonth()->startOfMonth();
        $lastMonthEnd   = now()->subMonth()->endOfMonth();

        $thisIncome = $wallet->transactions()->where('amount', '>', 0)->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])->sum('amount');
        $thisExpense = abs($wallet->transactions()->where('amount', '<', 0)->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])->sum('amount'));

        $lastIncome = $wallet->transactions()->where('amount', '>', 0)->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->sum('amount');
        $lastExpense = abs($wallet->transactions()->where('amount', '<', 0)->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->sum('amount'));

        $transactions = $wallet->transactions()->latest()->take(5)->get();

        // Menggunakan polymorphic matching persis seperti tim backend
        $pendingWithdrawal = Withdrawal::where('owner_type', get_class($user))
            ->where('owner_id', $user->id)
            ->whereIn('status', [Withdrawal::STATUS_REQUESTED, Withdrawal::STATUS_PROCESSING])
            ->first();
        */

    // [DUMMY]
    $balance = 5000000;
    $thisIncome = 1500000;
    $lastIncome = 1000000;
    $thisExpense = 500000;
    $lastExpense = 200000;
    $transactions = collect([]);
    $pendingWithdrawal = null;

    return Inertia::render('affiliate/dashboard/fund/wallet/index', [
      'balance' => (int) $balance,
      'income' => [
        'this_month' => (int) $thisIncome,
        'last_month' => (int) $lastIncome,
        'growth_pct' => $this->growthPercentage($thisIncome, $lastIncome),
      ],
      'expenses' => [
        'this_month' => (int) $thisExpense,
        'last_month' => (int) $lastExpense,
        'growth_pct' => $this->growthPercentage($thisExpense, $lastExpense),
      ],
      'net_change' => [
        'this_month' => $thisIncome - $thisExpense,
        'last_month' => $lastIncome - $lastExpense,
        'growth_pct' => $this->growthPercentage($thisIncome - $thisExpense, $lastIncome - $lastExpense),
      ],
      'transactions' => $transactions,
      'pending_withdrawal' => $pendingWithdrawal,
    ]);
  }

  private function growthPercentage(int $current, int $previous): float
  {
    if ($previous === 0) return $current > 0 ? 100.0 : 0.0;
    return round((($current - $previous) / abs($previous)) * 100, 2);
  }
}
