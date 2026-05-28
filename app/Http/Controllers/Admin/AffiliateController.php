<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CompanyType;
use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\User;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Inertia\Inertia;
use Inertia\Response;

#[Authorize('access-admin')]
class AffiliateController extends Controller
{
    public function index(): Response
    {
        $data = AffiliateProfile::query()
            ->with(['user', 'upline.affiliateProfile.upline.affiliateProfile'])
            ->where('tier', 'affiliate')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (AffiliateProfile $profile): array => [
                'id' => $profile->id,
                'name' => $profile->user?->name ?? '-',
                'email' => $profile->user?->email ?? '-',
                'phone' => $profile->phone ?: $profile->user?->phone,
                'referral_code' => $profile->referral_code,
                'status' => $profile->status,
                'user_status' => $this->enumValue($profile->user?->status),
                'is_inactive' => $this->isInactive($profile, $profile->user),
                'master_affiliate' => $this->networkPerson($profile->upline, $profile->upline?->affiliateProfile),
                'partner' => $this->networkPerson($profile->upline?->affiliateProfile?->upline, $profile->upline?->affiliateProfile?->upline?->affiliateProfile),
                'invited_agents_count' => $this->countInvitedAgents($profile),
                'subscribed_agents_count' => $this->countSubscribedAgents($profile),
                'created_at' => $profile->created_at,
            ]);

        return Inertia::render('admin/database/affiliates/index', [
            'data' => [
                'data' => $data,
                'total' => $data->count(),
            ],
        ]);
    }

    private function countInvitedAgents(AffiliateProfile $profile): int
    {
        return Company::query()
            ->where('type', CompanyType::AGENT)
            ->where('referred_by', $profile->user_id)
            ->count();
    }

    private function countSubscribedAgents(AffiliateProfile $profile): int
    {
        return Company::query()
            ->where('type', CompanyType::AGENT)
            ->where('referred_by', $profile->user_id)
            ->whereHas('agentSubscription', fn ($query) => $query
                ->whereNotNull('started_at')
                ->whereNotNull('ended_at'))
            ->count();
    }

    private function networkPerson(?User $user, ?AffiliateProfile $profile): ?array
    {
        if (! $user || ! $profile) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'referral_code' => $profile->referral_code,
            'status' => $profile->status,
            'user_status' => $this->enumValue($user->status),
            'is_inactive' => $this->isInactive($profile, $user),
        ];
    }

    private function isInactive(?AffiliateProfile $profile, ?User $user): bool
    {
        if (! $profile || ! $user) {
            return false;
        }

        return $profile->status !== 'approved' || $this->enumValue($user->status) !== 'active';
    }

    private function enumValue(mixed $value): mixed
    {
        return $value instanceof \BackedEnum ? $value->value : $value;
    }
}
