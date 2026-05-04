<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\Company;
use App\Enums\CompanyType;

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
      $level2_Ids = !empty($level1_Ids) ? AffiliateProfile::whereIn('upline_id', $level1_Ids)->pluck('user_id')->toArray() : [];
      $allowedIds = array_unique(array_merge($allowedIds, $level1_Ids, $level2_Ids));
    } elseif (in_array($tier, ['master_affiliate', 'master-affiliate'])) {
      $level1_Ids = AffiliateProfile::where('upline_id', $user->id)->pluck('user_id')->toArray();
      $allowedIds = array_unique(array_merge($allowedIds, $level1_Ids));
    }

    $query = Company::withoutGlobalScopes()
      ->with(['referrer.affiliateProfile.upline', 'photo'])
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

      return [
        'id' => $agent->id,
        'name' => $agent->name,
        'email' => $agent->email,
        'phone' => $agent->phone,
        'customer_service_phone' => $agent->customer_service_phone,
        'address' => !empty($addressParts) ? implode(', ', $addressParts) : '-',
        'identity_number' => $agent->identity_number ?? data_get($meta, 'identity_number'),
        'identity_photo_path' => $agent->identity_photo_path ?? data_get($meta, 'identity_photo_path'),
        'photo_url' => $photoUrl,
        'join_date' => $agent->created_at ? $agent->created_at->format('d M Y') : '-',
        'affiliator_name' => $affiliatorName,
        'ma_name' => $maName,
      ];
    })->values()->toArray();

    return Inertia::render('affiliate/dashboard/agent/list', [
      'agents' => $agentsData,
      'userTier' => $tier,
    ]);
  }
}
