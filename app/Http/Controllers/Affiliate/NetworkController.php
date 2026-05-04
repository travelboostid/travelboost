<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
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

    $query = User::select(
      'users.id',
      'users.name',
      'users.email',
      'users.username',
      'users.created_at',
      'ap.id as profile_id',
      'ap.phone',
      'ap.tier',
      'ap.approved_at',
      'ap.identity_number',
      'ap.identity_photo_path',
      'ap.profile_photo_path',
      'ap.address',
      'ap.city',
      'ap.province',
      'upline.name as upline_name'
    )
      ->join('affiliate_profiles as ap', 'users.id', '=', 'ap.user_id')
      ->leftJoin('users as upline', 'ap.upline_id', '=', 'upline.id')
      ->where('ap.status', 'approved');

    if ($tier === 'ma') {
      $query->where('ap.tier', 'master_affiliate')
        ->where('ap.upline_id', $user->id);
    } else {
      $query->where('ap.tier', 'affiliate');

      if ($isPartner) {
        $maIds = AffiliateProfile::where('upline_id', $user->id)
          ->where('tier', 'master_affiliate')
          ->pluck('user_id');
        $query->whereIn('ap.upline_id', $maIds);
      } else {
        $query->where('ap.upline_id', $user->id);
      }
    }

    $networks = $query->get()->map(function ($network) {
      $affiliatesQuery = AffiliateProfile
        ::where('upline_id', $network->id)
        ->where('tier', 'affiliate')
        ->where('status', 'approved');

      $total_affiliators = $affiliatesQuery->count();

      $referrerIds = [$network->id];
      if ($network->tier === 'master_affiliate') {
        $downlineAffiliateIds = $affiliatesQuery->pluck('user_id')->toArray();
        $referrerIds = array_merge($referrerIds, $downlineAffiliateIds);
      }

      $total_agents = Company::where('type', 'agent')
        ->whereIn('referred_by', $referrerIds)
        ->count();

      $subscribed_agents = Company::where('type', 'agent')
        ->whereIn('referred_by', $referrerIds)
        ->whereHas('agentSubscription', function ($q) {
          $q->whereNotNull('package_id');
        })
        ->count();


      return [
        'id' => $network->id,
        'profile_id' => $network->profile_id,
        'name' => $network->name,
        'username' => $network->username,
        'email' => $network->email,
        'phone' => $network->phone,
        'address' => trim($network->address . ' ' . $network->city . ' ' . $network->province),
        'identity_number' => $network->identity_number,
        'identity_photo_path' => $network->identity_photo_path,
        'profile_photo_path' => $network->profile_photo_path,
        'upline_name' => $network->upline_name,
        'tier' => $network->tier,
        'created_at' => $network->created_at,
        'approved_at' => $network->approved_at,
        'total_affiliators' => $total_affiliators,
        'total_agents' => $total_agents,
        'subscribed_agents' => $subscribed_agents,
      ];
    });

    return Inertia::render('affiliate/dashboard/network/list', [
      'networks' => $networks
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
      ->with('user')
      ->orderBy('created_at', 'desc');

    if ($tierFilter === 'ma') {
      $query->where('tier', 'master_affiliate');
    } else {
      $query->where('tier', 'affiliate');
    }

    $pending = $query->get()->map(function ($profile) {
      return [
        'id' => $profile->id,
        'status' => $profile->status,
        'name' => $profile->user->name ?? '-',
        'email' => $profile->user->email ?? '-',
        'username' => $profile->user->username ?? '-',
        'phone' => $profile->phone ?? '-',
        'address' => trim($profile->address . ' ' . $profile->city . ' ' . $profile->province),
        'identity_number' => $profile->identity_number ?? '-',
        'identity_photo_path' => $profile->identity_photo_path ?? null,
        'profile_photo_path' => $profile->profile_photo_path ?? null,
        'registered_at' => $profile->created_at ? $profile->created_at->format('d M Y') : '-',
      ];
    });

    return Inertia::render('affiliate/dashboard/network/approvals', [
      'pending_approvals' => $pending
    ]);
  }

  public function approve(Request $request, $id)
  {
    $profile = AffiliateProfile::findOrFail($id);
    $user = $request->user();
    $userProfile = AffiliateProfile::where('user_id', $user->id)->first();

    $isAuthorized = $profile->upline_id === $user->id ||
      ($userProfile && $userProfile->tier === 'partner' && AffiliateProfile::where('user_id', $profile->upline_id)->where('upline_id', $user->id)->exists());

    if (!$isAuthorized) abort(403);

    $profile->update([
      'status' => 'approved',
      'approved_at' => now(),
    ]);

    if ($profile->user) {
      $profile->user->update(['status' => 'active']);
    }

    return back()->with('success', 'Affiliate has been approved.');
  }

  public function reject(Request $request, $id)
  {
    $profile = AffiliateProfile::findOrFail($id);
    $user = $request->user();

    if ($profile->upline_id !== $user->id) {
      abort(403);
    }

    $profile->update([
      'status' => 'rejected',
    ]);

    if ($profile->user) {
      $profile->user->update(['status' => 'inactive']);
    }

    return back()->with('success', 'Account has been deactivated.');
  }
}
