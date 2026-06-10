<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
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

        $networkPerformance = $this->buildNetworkPerformance($user);

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

    protected function buildNetworkPerformance(User $user): Collection
    {
        return AffiliateProfile::query()
            ->where('upline_id', $user->id)
            ->with('user')
            ->get()
            ->map(function (AffiliateProfile $profile): array {
                $referrerIds = $this->resolveReferrerIds($profile);

                $totalAgents = Company::query()
                    ->where('type', 'agent')
                    ->whereIn('referred_by', $referrerIds)
                    ->count();

                $subscribedAgents = Company::query()
                    ->where('type', 'agent')
                    ->whereIn('referred_by', $referrerIds)
                    ->whereHas('agentSubscription', function ($query): void {
                        $query->whereNotNull('package_id')
                            ->where('ended_at', '>', now());
                    })
                    ->count();

                $tierName = in_array(
                    $profile->tier,
                    ['master_affiliate', 'master-affiliate'],
                    true,
                ) ? 'MA' : 'Affiliate';

                return [
                    'name' => ($profile->user->name ?? 'Unknown').' ('.$tierName.')',
                    'total_agents' => $totalAgents,
                    'subscribed_agents' => $subscribedAgents,
                    'conversion' => $totalAgents > 0
                      ? (float) round(($subscribedAgents / $totalAgents) * 100, 2)
                      : 0.0,
                    'status' => ucfirst($profile->status),
                ];
            })
            ->sort(function (array $left, array $right): int {
                return [$right['subscribed_agents'], $right['conversion']]
                  <=> [$left['subscribed_agents'], $left['conversion']];
            })
            ->take(5)
            ->values();
    }

    protected function resolveReferrerIds(AffiliateProfile $profile): array
    {
        $referrerIds = [$profile->user_id];

        if (in_array($profile->tier, ['master_affiliate', 'master-affiliate'], true)) {
            $downlineAffiliateIds = AffiliateProfile::query()
                ->where('upline_id', $profile->user_id)
                ->where('tier', 'affiliate')
                ->where('status', 'approved')
                ->pluck('user_id')
                ->all();

            $referrerIds = [...$referrerIds, ...$downlineAffiliateIds];
        }

        return $referrerIds;
    }
}
