<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\Domain;
use App\Notifications\AffiliatePartnerReviewStatusNotification;
use App\Notifications\AffiliateReviewStatusNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class NetworkController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $tier = $request->query('tier', 'affiliate');

        $userProfile = AffiliateProfile::where('user_id', $user->id)->first();
        $isPartner = $userProfile && $userProfile->tier === 'partner';

        $query = AffiliateProfile::with(['user', 'upline', 'photo', 'identityCard'])
            ->where('status', 'approved');

        if ($tier === 'ma') {
            $query->where('tier', 'master_affiliate')
                ->where('upline_id', $user->id);
        } else {
            $query->where('tier', 'affiliate');

            if ($isPartner) {
                $maIds = AffiliateProfile::where('upline_id', $user->id)
                    ->where('tier', 'master_affiliate')
                    ->pluck('user_id');
                $query->whereIn('upline_id', $maIds);
            } else {
                $query->where('upline_id', $user->id);
            }
        }

        $profiles = $query->get();

        if ($profiles->isEmpty()) {
            return Inertia::render('affiliate/dashboard/network/list', [
                'networks' => collect(),
            ]);
        }

        $networkStats = $this->networkStatsForProfiles($profiles);

        $networks = $profiles->map(function ($profile) use ($networkStats) {
            $stats = $networkStats[$profile->user_id] ?? [
                'total_affiliators' => 0,
                'total_agents' => 0,
                'subscribed_agents' => 0,
            ];

            $photoUrl = null;
            if ($profile->photo) {
                $m = is_string($profile->photo->data) ? json_decode($profile->photo->data, true) : $profile->photo->data;
                $photoUrl = data_get($m, 'files.0.url') ?? data_get($m, 'url');
                if ($photoUrl) {
                    $photoUrl = str_replace('\\/', '/', $photoUrl);
                }
            }
            if (! $photoUrl && ! empty($profile->profile_photo_path)) {
                $photoUrl = '/storage/'.ltrim($profile->profile_photo_path, '/');
            }

            $identityCardUrl = null;
            if ($profile->identityCard) {
                $m = is_string($profile->identityCard->data) ? json_decode($profile->identityCard->data, true) : $profile->identityCard->data;
                $identityCardUrl = data_get($m, 'files.0.url') ?? data_get($m, 'url');
                if ($identityCardUrl) {
                    $identityCardUrl = str_replace('\\/', '/', $identityCardUrl);
                }
            }
            if (! $identityCardUrl && ! empty($profile->identity_photo_path)) {
                $identityCardUrl = '/storage/'.ltrim($profile->identity_photo_path, '/');
            }

            return [
                'id' => $profile->user_id,
                'profile_id' => $profile->id,
                'name' => $profile->user->name ?? '-',
                'username' => $profile->user->username ?? '-',
                'email' => $profile->user->email ?? '-',
                'phone' => $profile->phone,
                'address' => trim($profile->address.' '.$profile->city.' '.$profile->province),
                'identity_number' => $profile->identity_number,
                'photo_url' => $photoUrl,
                'identity_card_url' => $identityCardUrl,
                'upline_name' => $profile->upline->name ?? '-',
                'tier' => $profile->tier,
                'created_at' => $profile->user->created_at ?? null,
                'approved_at' => $profile->approved_at,
                'total_affiliators' => $stats['total_affiliators'],
                'total_agents' => $stats['total_agents'],
                'subscribed_agents' => $stats['subscribed_agents'],
            ];
        });

        return Inertia::render('affiliate/dashboard/network/list', [
            'networks' => $networks,
        ]);
    }

    public function getChartData(Request $request)
    {
        $user = $request->user();
        $top = $request->input('top', 5);

        $data = AffiliateProfile::where('upline_id', $user->id)
            ->where('status', 'approved')
            ->with('user:id,name,username')
            ->take($top)
            ->get()
            ->map(function ($affiliate) {
                return [
                    'name' => $affiliate->user->username ?? 'Unknown',
                    'invited' => 0,
                    'subscribed' => 0,
                ];
            });

        return response()->json($data);
    }

    public function approvals(Request $request)
    {
        $user = $request->user();
        $tierFilter = $request->query('tier');

        $query = AffiliateProfile::where('upline_id', $user->id)
            ->whereIn('status', ['pending', 'rejected'])
            ->with(['user', 'photo', 'identityCard'])
            ->orderBy('created_at', 'desc');

        if ($tierFilter === 'ma') {
            $query->where('tier', 'master_affiliate');
        } else {
            $query->where('tier', 'affiliate');
        }

        $pending = $query->get()->map(function ($profile) {
            $photoUrl = null;
            if ($profile->photo) {
                $m = is_string($profile->photo->data) ? json_decode($profile->photo->data, true) : $profile->photo->data;
                $photoUrl = data_get($m, 'files.0.url') ?? data_get($m, 'url');
                if ($photoUrl) {
                    $photoUrl = str_replace('\\/', '/', $photoUrl);
                }
            }
            if (! $photoUrl && ! empty($profile->profile_photo_path)) {
                $photoUrl = '/storage/'.ltrim($profile->profile_photo_path, '/');
            }

            $identityCardUrl = null;
            if ($profile->identityCard) {
                $m = is_string($profile->identityCard->data) ? json_decode($profile->identityCard->data, true) : $profile->identityCard->data;
                $identityCardUrl = data_get($m, 'files.0.url') ?? data_get($m, 'url');
                if ($identityCardUrl) {
                    $identityCardUrl = str_replace('\\/', '/', $identityCardUrl);
                }
            }
            if (! $identityCardUrl && ! empty($profile->identity_photo_path)) {
                $identityCardUrl = '/storage/'.ltrim($profile->identity_photo_path, '/');
            }

            return [
                'id' => $profile->id,
                'status' => $profile->status,
                'name' => $profile->user->name ?? '-',
                'email' => $profile->user->email ?? '-',
                'username' => $profile->user->username ?? '-',
                'phone' => $profile->phone ?? '-',
                'address' => trim($profile->address.' '.$profile->city.' '.$profile->province),
                'identity_number' => $profile->identity_number ?? '-',
                'photo_url' => $photoUrl,
                'identity_card_url' => $identityCardUrl,
                'registered_at' => $profile->created_at ? $profile->created_at->format('d M Y') : '-',
            ];
        });

        return Inertia::render('affiliate/dashboard/network/approvals', [
            'pending_approvals' => $pending,
        ]);
    }

    public function approve(Request $request, $id)
    {
        $profile = AffiliateProfile::findOrFail($id);
        $user = $request->user();
        $userProfile = AffiliateProfile::where('user_id', $user->id)->first();

        $isAuthorized = $profile->upline_id === $user->id ||
          ($userProfile && $userProfile->tier === 'partner' && AffiliateProfile::where('user_id', $profile->upline_id)->where('upline_id', $user->id)->exists());

        if (! $isAuthorized) {
            abort(403);
        }

        DB::transaction(function () use ($profile) {
            $profile->update([
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            if ($profile->user) {
                $profile->user->update(['status' => 'active']);
            }

            $domain = Domain::where('owner_type', AffiliateProfile::class)->where('owner_id', $profile->id)->first();
            if ($domain) {
                $domain->update([
                    'domain_enabled' => true,
                    'subdomain_enabled' => true,
                ]);
            }
        });

        $profile->load(['user', 'upline.affiliateProfile.user']);

        if ($profile->tier === 'affiliate' && $profile->user) {
            $profile->user->notify(new AffiliateReviewStatusNotification($profile, 'approved'));

            $maProfile = $profile->upline?->affiliateProfile;
            $partnerProfile = $maProfile?->upline?->affiliateProfile;

            if (
                $maProfile &&
                $maProfile->tier === 'master_affiliate' &&
                $partnerProfile &&
                $partnerProfile->tier === 'partner' &&
                $partnerProfile->user &&
                $partnerProfile->user_id !== $user->id
            ) {
                $partnerProfile->user->notify(
                    new AffiliatePartnerReviewStatusNotification($profile, $maProfile, 'approved')
                );
            }
        }

        return back()->with('success', 'Affiliate has been approved and domain is now active.');
    }

    public function reject(Request $request, $id)
    {
        $profile = AffiliateProfile::findOrFail($id);
        $user = $request->user();

        if ($profile->upline_id !== $user->id) {
            abort(403);
        }

        DB::transaction(function () use ($profile) {
            $profile->update([
                'status' => 'rejected',
            ]);

            if ($profile->user) {
                $profile->user->update(['status' => 'inactive']);
            }

            $domain = Domain::where('owner_type', AffiliateProfile::class)->where('owner_id', $profile->id)->first();
            if ($domain) {
                $domain->update([
                    'domain_enabled' => false,
                    'subdomain_enabled' => false,
                ]);
            }
        });

        $profile->load(['user', 'upline.affiliateProfile.user']);

        if ($profile->tier === 'affiliate' && $profile->user) {
            $profile->user->notify(new AffiliateReviewStatusNotification($profile, 'rejected'));

            $maProfile = $profile->upline?->affiliateProfile;
            $partnerProfile = $maProfile?->upline?->affiliateProfile;

            if (
                $maProfile &&
                $maProfile->tier === 'master_affiliate' &&
                $partnerProfile &&
                $partnerProfile->tier === 'partner' &&
                $partnerProfile->user &&
                $partnerProfile->user_id !== $user->id
            ) {
                $partnerProfile->user->notify(
                    new AffiliatePartnerReviewStatusNotification($profile, $maProfile, 'rejected')
                );
            }
        }

        return back()->with('success', 'Account has been deactivated and domain access restricted.');
    }

    /**
     * @param  Collection<int, AffiliateProfile>  $profiles
     * @return array<int, array{total_affiliators: int, total_agents: int, subscribed_agents: int}>
     */
    private function networkStatsForProfiles(Collection $profiles): array
    {
        $networkIds = $profiles->pluck('user_id');

        $affiliatorCounts = AffiliateProfile::query()
            ->whereIn('upline_id', $networkIds)
            ->where('tier', 'affiliate')
            ->where('status', 'approved')
            ->groupBy('upline_id')
            ->selectRaw('upline_id, count(*) as aggregate')
            ->pluck('aggregate', 'upline_id');

        $downlineAffiliatesByUpline = AffiliateProfile::query()
            ->whereIn('upline_id', $networkIds)
            ->where('tier', 'affiliate')
            ->where('status', 'approved')
            ->get(['upline_id', 'user_id'])
            ->groupBy('upline_id')
            ->map(fn (Collection $rows): Collection => $rows->pluck('user_id'));

        $referrerIdsByNetwork = $profiles->mapWithKeys(function (AffiliateProfile $profile) use ($downlineAffiliatesByUpline): array {
            $referrerIds = [$profile->user_id];

            if ($profile->tier === 'master_affiliate') {
                $referrerIds = array_merge(
                    $referrerIds,
                    $downlineAffiliatesByUpline->get($profile->user_id, collect())->all()
                );
            }

            return [$profile->user_id => $referrerIds];
        });

        $allReferrerIds = $referrerIdsByNetwork->flatten()->unique()->values();

        $agentCountsByReferrer = Company::query()
            ->where('type', 'agent')
            ->whereIn('referred_by', $allReferrerIds)
            ->groupBy('referred_by')
            ->selectRaw('referred_by, count(*) as aggregate')
            ->pluck('aggregate', 'referred_by');

        $subscribedAgentCountsByReferrer = Company::query()
            ->where('type', 'agent')
            ->whereIn('referred_by', $allReferrerIds)
            ->whereHas('agentSubscription', function ($query): void {
                $query->whereNotNull('package_id')->where('package_id', '!=', 1);
            })
            ->groupBy('referred_by')
            ->selectRaw('referred_by, count(*) as aggregate')
            ->pluck('aggregate', 'referred_by');

        $sumForReferrers = function (array $referrerIds, Collection $countsByReferrer): int {
            return (int) collect($referrerIds)->sum(
                fn (int $referrerId): int => (int) ($countsByReferrer[$referrerId] ?? 0)
            );
        };

        return $profiles->mapWithKeys(function (AffiliateProfile $profile) use (
            $affiliatorCounts,
            $referrerIdsByNetwork,
            $agentCountsByReferrer,
            $subscribedAgentCountsByReferrer,
            $sumForReferrers,
        ): array {
            $referrerIds = $referrerIdsByNetwork->get($profile->user_id, [$profile->user_id]);

            return [
                $profile->user_id => [
                    'total_affiliators' => (int) ($affiliatorCounts[$profile->user_id] ?? 0),
                    'total_agents' => $sumForReferrers($referrerIds, $agentCountsByReferrer),
                    'subscribed_agents' => $sumForReferrers($referrerIds, $subscribedAgentCountsByReferrer),
                ],
            ];
        })->all();
    }
}
