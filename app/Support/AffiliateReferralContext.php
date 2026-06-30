<?php

namespace App\Support;

use App\Models\AffiliateProfile;
use App\Models\Domain;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;

class AffiliateReferralContext
{
    public function currentReferralAffiliate(?Request $request = null): ?AffiliateProfile
    {
        $request ??= request();

        $affiliate = Context::get('affiliate');
        if ($affiliate instanceof AffiliateProfile) {
            return $affiliate->relationLoaded('user') ? $affiliate : $affiliate->loadMissing('user');
        }

        $domain = Context::get('domain');
        if ($domain instanceof Domain && $domain->owner instanceof AffiliateProfile) {
            $profile = $domain->owner;

            return $profile->relationLoaded('user') ? $profile : $profile->loadMissing('user');
        }

        if (! $this->isMainHost($request)) {
            return null;
        }

        return $this->defaultAffiliate();
    }

    /**
     * @return array{id:int,name:string,username:string}|null
     */
    public function visibleAffiliatePayload(?Request $request = null): ?array
    {
        $request ??= request();

        $affiliate = $this->currentReferralAffiliate($request);
        if (! $affiliate || $this->shouldHideAffiliate($affiliate)) {
            return null;
        }

        $domain = Context::get('domain');
        $username = $affiliate->referral_code;

        if ($domain instanceof Domain && $domain->owner instanceof AffiliateProfile && filled($domain->subdomain)) {
            $username = $domain->subdomain;
        }

        return [
            'id' => $affiliate->user_id,
            'name' => $affiliate->user->name ?? '',
            'username' => $username,
        ];
    }

    public function shouldHideAffiliate(?AffiliateProfile $affiliate): bool
    {
        if (! $affiliate) {
            return false;
        }

        return strcasecmp((string) $affiliate->referral_code, $this->defaultReferralCode()) === 0;
    }

    public function defaultAffiliate(): ?AffiliateProfile
    {
        return AffiliateProfile::query()
            ->with('user')
            ->where('referral_code', $this->defaultReferralCode())
            ->where('status', 'approved')
            ->first();
    }

    public function defaultReferralCode(): string
    {
        return (string) env('DEFAULT_AFFILIATE_REFERRAL_CODE', 'tb-affiliate');
    }

    private function isMainHost(Request $request): bool
    {
        return $request->getHost() === env('APP_HOST', 'localhost');
    }
}
