<?php

namespace App\Http\Controllers\Affiliate;

use App\Enums\CompanyType;
use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AgentController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $profile = AffiliateProfile::where('user_id', $user->id)->first();
        $tier = $profile ? strtolower($profile->tier) : 'affiliate';

        $allowedIds = [$user->id];

        if ($tier === 'partner') {
            $level1_Ids = AffiliateProfile::where('upline_id', $user->id)->pluck('user_id')->toArray();
            $level2_Ids = ! empty($level1_Ids) ? AffiliateProfile::whereIn('upline_id', $level1_Ids)->pluck('user_id')->toArray() : [];
            $allowedIds = array_unique(array_merge($allowedIds, $level1_Ids, $level2_Ids));
        } elseif (in_array($tier, ['master_affiliate', 'master-affiliate'])) {
            $level1_Ids = AffiliateProfile::where('upline_id', $user->id)->pluck('user_id')->toArray();
            $allowedIds = array_unique(array_merge($allowedIds, $level1_Ids));
        }

        $query = Company::withoutGlobalScopes()
            ->with(['referrer.affiliateProfile.upline', 'photo', 'agentSubscription.package', 'aiCredit', 'identityCard'])
            ->where('type', CompanyType::AGENT)
            ->whereIn('referred_by', $allowedIds)
            ->orderBy('created_at', 'desc')
            ->get();

        $agentsData = $query->map(function ($agent) {
            $referrer = $agent->referrer;
            $referrerProfile = $referrer ? $referrer->affiliateProfile : null;

            $affiliatorName = '-';
            $maName = '-';

            if ($referrerProfile) {
                $rTier = strtolower($referrerProfile->tier);
                if ($rTier === 'affiliate') {
                    $affiliatorName = $referrer->name;
                    $maName = $referrerProfile->upline ? $referrerProfile->upline->name : '-';
                } elseif (in_array($rTier, ['master_affiliate', 'master-affiliate'])) {
                    $maName = $referrer->name;
                    $affiliatorName = '-';
                }
            }

            $meta = is_array($agent->meta) ? $agent->meta : json_decode($agent->meta ?? '[]', true);

            $addressParts = array_filter([
                $agent->address,
                $agent->village ?? data_get($meta, 'village'),
                $agent->district ?? data_get($meta, 'district'),
                $agent->city ?? data_get($meta, 'city'),
                $agent->province ?? data_get($meta, 'province'),
                $agent->postal_code ?? data_get($meta, 'postal_code'),
            ]);

            $photoUrl = null;
            if ($agent->photo) {
                $mediaData = is_string($agent->photo->data) ? json_decode($agent->photo->data, true) : $agent->photo->data;
                if (isset($mediaData['files']) && is_array($mediaData['files']) && count($mediaData['files']) > 0) {
                    $photoUrl = str_replace('\\/', '/', $mediaData['files'][0]['url']);
                }
            }

            $identityCardUrl = null;
            if ($agent->identityCard) {
                $mediaData = is_string($agent->identityCard->data) ? json_decode($agent->identityCard->data, true) : $agent->identityCard->data;
                if (isset($mediaData['files']) && is_array($mediaData['files']) && count($mediaData['files']) > 0) {
                    $identityCardUrl = str_replace('\\/', '/', $mediaData['files'][0]['url']);
                } elseif (isset($mediaData['url'])) {
                    $identityCardUrl = str_replace('\\/', '/', $mediaData['url']);
                }
            }

            $subscription = $agent->agentSubscription;
            $packageName = $subscription && $subscription->package ? $subscription->package->name : 'No Package';
            $subscriptionStatus = $subscription ? $subscription->status : null;
            if ($subscriptionStatus instanceof \BackedEnum) {
                $subscriptionStatus = $subscriptionStatus->value;
            }
            $subscriptionExpiredAt = $subscription && $subscription->ended_at ? $subscription->ended_at->format('d M Y') : '-';

            $aiCreditBalance = $agent->aiCredit ? (float) $agent->aiCredit->balance : 0;

            return [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email,
                'phone' => $agent->phone,
                'customer_service_phone' => $agent->customer_service_phone,
                'address' => ! empty($addressParts) ? implode(', ', $addressParts) : '-',
                'identity_number' => $agent->identity_number ?? data_get($meta, 'identity_number'),
                'photo_url' => $photoUrl,
                'identity_card_url' => $identityCardUrl,
                'join_date' => $agent->created_at ? $agent->created_at->format('d M Y') : '-',
                'affiliator_name' => $affiliatorName,
                'ma_name' => $maName,
                'subscription_package' => $packageName,
                'subscription_status' => strtolower($subscriptionStatus ?? 'inactive'),
                'subscription_expired_at' => $subscriptionExpiredAt,
                'ai_credit_balance' => $aiCreditBalance,
            ];
        })->values()->toArray();

        return Inertia::render('affiliate/dashboard/agent/list', [
            'agents' => $agentsData,
            'userTier' => $tier,
        ]);
    }
}
