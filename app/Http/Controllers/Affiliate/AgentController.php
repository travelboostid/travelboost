<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\Company;

class AgentController extends Controller
{
  public function index(Request $request)
  {
    $user = Auth::user();
    $profile = AffiliateProfile::where('user_id', $user->id)->first();
    $tier = $profile ? $profile->tier : 'affiliate';

    $allowedIds = [$user->id];

    if ($tier === 'partner') {
      $level1_Ids = AffiliateProfile::where('upline_id', $user->id)->pluck('user_id')->toArray();
      $level2_Ids = !empty($level1_Ids) ? AffiliateProfile::whereIn('upline_id', $level1_Ids)->pluck('user_id')->toArray() : [];
      $allowedIds = array_merge($allowedIds, $level1_Ids, $level2_Ids);
    } elseif (in_array($tier, ['master_affiliate', 'master-affiliate'])) {
      $level1_Ids = AffiliateProfile::where('upline_id', $user->id)->pluck('user_id')->toArray();
      $allowedIds = array_merge($allowedIds, $level1_Ids);
    }

    $query = Company::with(['referrer.affiliateProfile.upline'])
      ->where('type', 'agent')
      ->whereIn('referred_by', $allowedIds)
      ->orderBy('created_at', 'desc')
      ->get();

    $agentsData = $query->map(function ($agent) {
      $referrer = $agent->referrer;
      $referrerProfile = $referrer ? $referrer->affiliateProfile : null;

      $affiliatorName = '-';
      $maName = '-';

      if ($referrerProfile) {
        if ($referrerProfile->tier === 'affiliate') {
          $affiliatorName = $referrer->name;
          $maName = $referrerProfile->upline ? $referrerProfile->upline->name : '-';
        } elseif (in_array($referrerProfile->tier, ['master_affiliate', 'master-affiliate'])) {
          $maName = $referrer->name;
          $affiliatorName = '-';
        }
      }

      $addressParts = array_filter([
        $agent->address,
        $agent->village ?? data_get($agent->meta, 'village'),
        $agent->district ?? data_get($agent->meta, 'district'),
        $agent->city ?? data_get($agent->meta, 'city'),
        $agent->province ?? data_get($agent->meta, 'province'),
        $agent->postal_code ?? data_get($agent->meta, 'postal_code'),
      ]);

      return [
        'id' => $agent->id,
        'name' => $agent->name,
        'email' => $agent->email,
        'phone' => $agent->phone,
        'customer_service_phone' => $agent->customer_service_phone,
        'address' => !empty($addressParts) ? implode(', ', $addressParts) : '-',
        'identity_number' => $agent->identity_number ?? data_get($agent->meta, 'identity_number'),
        'identity_photo_path' => $agent->identity_photo_path ?? data_get($agent->meta, 'identity_photo_path'),
        'join_date' => $agent->created_at ? $agent->created_at->format('Y-m-d') : '-',
        'affiliator_name' => $affiliatorName,
        'ma_name' => $maName,
      ];
    });

    return Inertia::render('affiliate/dashboard/agent/list', [
      'agents' => $agentsData,
      'userTier' => $tier,
    ]);
  }
}
