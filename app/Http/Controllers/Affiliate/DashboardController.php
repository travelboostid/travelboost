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
    /** @var \App\Models\User $user */
    $user = Auth::user();

    $profile = $user->affiliateProfile;
    $tier = $profile ? $profile->tier : 'affiliate';

    $wallet = $user->wallet;
    $walletBalance = $wallet ? $wallet->balance : 0;

    $totalCommission = $wallet ? $wallet->transactions()->where('amount', '>', 0)->sum('amount') : 0;

    $unreadNotificationsCount = $user->unreadNotifications()->count();
    $recentNotifications = $user->notifications()->latest()->take(3)->get();

    $stats = [];
    $allNetworkIds = [$user->id];

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

    $recentAgents = Company::where('type', 'agent')
      ->whereIn('referred_by', $allNetworkIds)
      ->with('agentSubscription.package')
      ->latest()
      ->take(5)
      ->get()
      ->map(function ($agent) {
        $sub = $agent->agentSubscription;
        $isPaid = $sub && $sub->ended_at > now();
        return [
          'id' => $agent->username ?? $agent->id,
          'name' => $agent->name,
          'package' => $sub && $sub->package ? $sub->package->name : 'Basic',
          'status' => $isPaid ? 'Paid' : 'Pending',
        ];
      });

    $networkPerformance = AffiliateProfile::where('upline_id', $user->id)
      ->with(['user.wallet'])
      ->get()
      ->map(function ($profile) {
        $wallet = $profile->user->wallet ?? null;
        $revenue = $wallet ? $wallet->transactions()->where('amount', '>', 0)->sum('amount') : 0;
        $tierName = in_array($profile->tier, ['master_affiliate', 'master-affiliate']) ? 'MA' : 'Affiliate';

        return [
          'name' => $profile->user->name . ' (' . $tierName . ')',
          'revenue' => (float) $revenue,
          'status' => ucfirst($profile->status),
        ];
      })
      ->sortByDesc('revenue')
      ->take(5)
      ->values();

    return Inertia::render('affiliate/dashboard/index', [
      'wallet_balance' => (int) $walletBalance,
      'tier' => $tier,
      'stats' => $stats,
      'unreadNotificationsCount' => $unreadNotificationsCount,
      'recentNotifications' => $recentNotifications,
      'recentAgents' => $recentAgents,
      'networkPerformance' => $networkPerformance,
    ]);
  }
}
