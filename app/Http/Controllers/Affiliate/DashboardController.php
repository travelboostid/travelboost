<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\AffiliateProfile;
use App\Models\Company;

class DashboardController extends Controller
{
  public function index(Request $request)
  {
    $user = Auth::user();
    $profile = $user->affiliateProfile;
    $tier = $profile ? $profile->tier : 'affiliate';

    $wallet = $user->wallet;
    $walletBalance = $wallet ? $wallet->balance : 0;

    $totalCommission = $wallet ? $wallet->transactions()->where('amount', '>', 0)->sum('amount') : 0;

    $stats = [];

    if ($tier === 'partner') {
      $maIds = AffiliateProfile::where('upline_id', $user->id)
        ->whereIn('tier', ['master_affiliate', 'master-affiliate'])
        ->pluck('user_id');

      $affiliateIds = AffiliateProfile::whereIn('upline_id', $maIds)
        ->where('tier', 'affiliate')
        ->pluck('user_id');

      $allNetworkIds = collect([$user->id])->merge($maIds)->merge($affiliateIds)->toArray();

      $stats = [
        'total_ma' => AffiliateProfile::where('upline_id', $user->id)->whereIn('tier', ['master_affiliate', 'master-affiliate'])->where('status', 'approved')->count(),
        'total_affiliate' => AffiliateProfile::whereIn('upline_id', $maIds)->where('tier', 'affiliate')->where('status', 'approved')->count(),
        'total_agent' => Company::where('type', 'agent')->whereIn('referred_by', $allNetworkIds)->count(),
        'total_commission' => $totalCommission,
      ];
    } elseif (in_array($tier, ['master_affiliate', 'master-affiliate'])) {
      $affiliateIds = AffiliateProfile::where('upline_id', $user->id)
        ->where('tier', 'affiliate')
        ->pluck('user_id');

      $allNetworkIds = collect([$user->id])->merge($affiliateIds)->toArray();

      $stats = [
        'total_agent' => Company::where('type', 'agent')->whereIn('referred_by', $allNetworkIds)->count(),
        'total_affiliate_approved' => AffiliateProfile::where('upline_id', $user->id)->where('tier', 'affiliate')->where('status', 'approved')->count(),
        'total_affiliate_pending' => AffiliateProfile::where('upline_id', $user->id)->where('tier', 'affiliate')->where('status', 'pending')->count(),
        'total_commission' => $totalCommission,
      ];
    } else {
      $stats = [
        'total_agent_pending' => Company::where('type', 'agent')
          ->where('referred_by', $user->id)
          ->whereDoesntHave('agentSubscription', function ($q) {
            $q->where('ended_at', '>', now());
          })->count(),
        'total_agent_subscribed' => Company::where('type', 'agent')
          ->where('referred_by', $user->id)
          ->whereHas('agentSubscription', function ($q) {
            $q->where('ended_at', '>', now());
          })->count(),
        'total_commission' => $totalCommission,
      ];
    }

    return Inertia::render('affiliate/dashboard/index', [
      'wallet_balance' => (int) $walletBalance,
      'tier' => $tier,
      'stats' => $stats,
    ]);
  }
}
