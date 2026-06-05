<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class MasterAffiliateController extends Controller
{
    public function index(): Response
    {
        $data = AffiliateProfile::query()
            ->with(['user', 'upline.affiliateProfile'])
            ->whereIn('tier', ['master_affiliate', 'master-affiliate'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (AffiliateProfile $profile): array {
                $invitedAffiliates = AffiliateProfile::query()
                    ->with('user')
                    ->where('tier', 'affiliate')
                    ->where('upline_id', $profile->user_id)
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(fn (AffiliateProfile $affiliate): array => [
                        'id' => $affiliate->id,
                        'name' => $affiliate->user?->name ?? '-',
                        'email' => $affiliate->user?->email ?? '-',
                        'referral_code' => $affiliate->referral_code,
                        'status' => $affiliate->status,
                        'is_inactive' => $this->isInactive($affiliate, $affiliate->user),
                    ]);

                return [
                    'id' => $profile->id,
                    'name' => $profile->user?->name ?? '-',
                    'email' => $profile->user?->email ?? '-',
                    'phone' => $profile->phone ?: $profile->user?->phone,
                    'referral_code' => $profile->referral_code,
                    'status' => $profile->status,
                    'user_status' => $this->enumValue($profile->user?->status),
                    'is_inactive' => $this->isInactive($profile, $profile->user),
                    'partner' => $this->networkPerson($profile->upline, $profile->upline?->affiliateProfile),
                    'invited_affiliates_count' => $invitedAffiliates->count(),
                    'invited_affiliates' => $invitedAffiliates,
                    'created_at' => $profile->created_at,
                ];
            });

        return Inertia::render('admin/database/master-affiliates/index', [
            'data' => [
                'data' => $data,
                'total' => $data->count(),
            ],
        ]);
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
