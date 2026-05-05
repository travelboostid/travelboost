<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
  public function index(Request $request)
  {
    $user = $request->user();

    $wallet = $user->wallet;

    if (!$wallet) {
      $wallet = $user->wallet()->create([
        'name' => 'Main Wallet',
        'slug' => 'main',
        'description' => 'Primary wallet for user transactions',
      ]);
    }

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

    $pendingWithdrawal = Withdrawal::where('owner_type', get_class($user))
      ->where('owner_id', $user->id)
      ->whereIn('status', [Withdrawal::STATUS_REQUESTED, Withdrawal::STATUS_PROCESSING])
      ->first();

    $recentCommissions = DB::table('affiliate_commission_histories')
      ->join('companies', 'affiliate_commission_histories.company_id', '=', 'companies.id')
      ->select('affiliate_commission_histories.*', 'companies.name as company_name')
      ->where('recipient_id', $user->id)
      ->orderBy('affiliate_commission_histories.created_at', 'desc')
      ->take(5)
      ->get();

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
      'recent_commissions' => $recentCommissions,
    ]);
  }

  private function growthPercentage(int $current, int $previous): float
  {
    if ($previous === 0) return $current > 0 ? 100.0 : 0.0;
    return round((($current - $previous) / abs($previous)) * 100, 2);
  }
}