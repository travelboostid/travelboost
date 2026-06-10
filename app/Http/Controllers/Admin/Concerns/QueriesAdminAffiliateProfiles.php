<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Enums\CompanyType;
use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

trait QueriesAdminAffiliateProfiles
{
    /**
     * @param  Builder<AffiliateProfile>  $query
     * @param  array<string, mixed>  $validated
     */
    protected function applyAffiliateProfileIndexFilters(Builder $query, array $validated): void
    {
        $query
            ->when($validated['name'] ?? null, function (Builder $query, string $name): void {
                $query->whereHas('user', fn (Builder $userQuery) => $userQuery->where('name', 'ilike', "%{$name}%"));
            })
            ->when($validated['email'] ?? null, function (Builder $query, string $email): void {
                $query->whereHas('user', fn (Builder $userQuery) => $userQuery->where('email', 'ilike', "%{$email}%"));
            })
            ->when($validated['phone'] ?? null, function (Builder $query, string $phone): void {
                $query->where(function (Builder $query) use ($phone): void {
                    $query
                        ->where('phone', 'ilike', "%{$phone}%")
                        ->orWhereHas('user', fn (Builder $userQuery) => $userQuery->where('phone', 'ilike', "%{$phone}%"));
                });
            })
            ->when($validated['referral_code'] ?? null, fn (Builder $query, string $referralCode) => $query->where('referral_code', 'ilike', "%{$referralCode}%"))
            ->when($validated['status'] ?? null, fn (Builder $query, array $statuses) => $query->whereIn('status', $statuses))
            ->when($validated['created_at'] ?? null, function (Builder $query, string $createdAt): void {
                $range = explode(',', $createdAt);

                if (count($range) === 2) {
                    $from = Carbon::createFromTimestamp(((int) $range[0]) / 1000);
                    $to = Carbon::createFromTimestamp(((int) $range[1]) / 1000);
                    $query->whereBetween('created_at', [$from, $to]);

                    return;
                }

                $date = Carbon::createFromTimestamp(((int) $range[0]) / 1000);
                $query->whereDate('created_at', $date);
            })
            ->when($validated['sort'] ?? null, function (Builder $query, string $sort): void {
                foreach (explode(',', $sort) as $item) {
                    $direction = str_starts_with($item, '-') ? 'desc' : 'asc';
                    $field = ltrim($item, '-');
                    $query->orderBy($field, $direction);
                }
            });
    }

    /**
     * @return array<string, mixed>
     */
    protected function affiliateListItem(AffiliateProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'name' => $profile->user?->name ?? '-',
            'email' => $profile->user?->email ?? '-',
            'phone' => $profile->phone ?: $profile->user?->phone,
            'referral_code' => $profile->referral_code,
            'status' => $profile->status,
            'user_status' => $this->affiliateEnumValue($profile->user?->status),
            'note' => $profile->user?->note,
            'is_inactive' => $this->affiliateIsInactive($profile, $profile->user),
            'created_at' => $profile->created_at,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function affiliateRowItem(AffiliateProfile $profile): array
    {
        return [
            ...$this->affiliateListItem($profile),
            'master_affiliate' => $this->affiliateNetworkPerson($profile->upline, $profile->upline?->affiliateProfile),
            'partner' => $this->affiliateNetworkPerson(
                $profile->upline?->affiliateProfile?->upline,
                $profile->upline?->affiliateProfile?->upline?->affiliateProfile,
            ),
            'invited_agents_count' => (int) ($profile->invited_agents_count ?? $this->countInvitedAgents($profile)),
            'subscribed_agents_count' => (int) ($profile->subscribed_agents_count ?? $this->countSubscribedAgents($profile)),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function masterAffiliateRowItem(AffiliateProfile $profile): array
    {
        $invitedAffiliates = $profile->relationLoaded('downlines')
            ? $profile->downlines
                ->where('tier', 'affiliate')
                ->map(fn (AffiliateProfile $affiliate): array => [
                    'id' => $affiliate->id,
                    'name' => $affiliate->user?->name ?? '-',
                    'email' => $affiliate->user?->email ?? '-',
                    'referral_code' => $affiliate->referral_code,
                    'status' => $affiliate->status,
                    'is_inactive' => $this->affiliateIsInactive($affiliate, $affiliate->user),
                ])
                ->values()
            : collect();

        return [
            ...$this->affiliateListItem($profile),
            'partner' => $this->affiliateNetworkPerson($profile->upline, $profile->upline?->affiliateProfile),
            'invited_affiliates_count' => (int) ($profile->invited_affiliates_count ?? $invitedAffiliates->count()),
            'invited_affiliates' => $invitedAffiliates->all(),
        ];
    }

    protected function countInvitedAgents(AffiliateProfile $profile): int
    {
        return Company::query()
            ->where('type', CompanyType::AGENT)
            ->where('referred_by', $profile->user_id)
            ->count();
    }

    protected function countSubscribedAgents(AffiliateProfile $profile): int
    {
        return Company::query()
            ->where('type', CompanyType::AGENT)
            ->where('referred_by', $profile->user_id)
            ->whereHas('agentSubscription', fn ($query) => $query
                ->whereNotNull('started_at')
                ->whereNotNull('ended_at'))
            ->count();
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function affiliateNetworkPerson(?User $user, ?AffiliateProfile $profile): ?array
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
            'user_status' => $this->affiliateEnumValue($user->status),
            'is_inactive' => $this->affiliateIsInactive($profile, $user),
        ];
    }

    protected function affiliateIsInactive(?AffiliateProfile $profile, ?User $user): bool
    {
        if (! $profile || ! $user) {
            return false;
        }

        return $profile->status !== 'approved' || $this->affiliateEnumValue($user->status) !== 'active';
    }

    protected function affiliateEnumValue(mixed $value): mixed
    {
        return $value instanceof \BackedEnum ? $value->value : $value;
    }

    protected function exportAffiliateProfilesCsv(Request $request, string $filename): StreamedResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'string'],
        ]);

        $profileIds = explode(',', $validated['ids']);

        return response()->streamDownload(
            function () use ($profileIds): void {
                $file = fopen('php://output', 'w');

                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

                fputcsv($file, [
                    'ID',
                    'User ID',
                    'Name',
                    'Email',
                    'Phone',
                    'Referral Code',
                    'Status',
                    'Created At',
                ]);

                AffiliateProfile::query()
                    ->with('user')
                    ->whereIn('id', $profileIds)
                    ->orderBy('id')
                    ->cursor()
                    ->each(function (AffiliateProfile $profile) use ($file): void {
                        fputcsv($file, [
                            $profile->id,
                            $profile->user_id,
                            $profile->user?->name,
                            $profile->user?->email,
                            $profile->phone ?: $profile->user?->phone,
                            $profile->referral_code,
                            $profile->status,
                            $profile->created_at?->toDateTimeString(),
                        ]);
                    });

                fclose($file);
            },
            $filename,
            ['Content-Type' => 'text/csv'],
        );
    }
}
