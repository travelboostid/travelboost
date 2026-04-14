<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
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

    // Cek apakah user yang login ini Partner
    $userProfile = AffiliateProfile::where('user_id', $user->id)->first();
    $isPartner = $userProfile && $userProfile->tier === 'partner';

    $query = User::select(
      'users.id',
      'users.name',
      'users.email',
      'users.username',
      'users.created_at',
      'ap.phone',
      'ap.tier'
    )
      ->join('affiliate_profiles as ap', 'users.id', '=', 'ap.user_id')
      ->where('ap.status', 'approved');

    if ($tier === 'ma') {
      // List MA: Hanya dilihat oleh Partner
      $query->where('ap.tier', 'master_affiliate')
        ->where('ap.upline_id', $user->id);
    } else {
      // List Affiliate
      $query->where('ap.tier', 'affiliate');

      if ($isPartner) {
        // Partner melihat SEMUA affiliate di bawah MA miliknya
        $maIds = AffiliateProfile::where('upline_id', $user->id)
          ->where('tier', 'master_affiliate')
          ->pluck('user_id');
        $query->whereIn('ap.upline_id', $maIds);
      } else {
        // MA melihat affiliate di bawah jaringannya sendiri
        $query->where('ap.upline_id', $user->id);
      }
    }

    $networks = $query->get()->map(function ($network) {

      // Hitung Affiliator di bawahnya
      $affiliatesQuery = DB::table('affiliate_profiles')
        ->where('upline_id', $network->id)
        ->where('tier', 'affiliate')
        ->where('status', 'approved');

      $total_affiliators = $affiliatesQuery->count();

      // Tentukan pengundang agen (Dia sendiri + turunan affiliatornya)
      $referrerIds = [$network->id];
      if ($network->tier === 'master_affiliate') {
        $downlineAffiliateIds = $affiliatesQuery->pluck('user_id')->toArray();
        $referrerIds = array_merge($referrerIds, $downlineAffiliateIds);
      }

      // Hitung Total Agen (di tabel companies)
      $total_agents = DB::table('companies')
        ->where('type', 'agent')
        ->whereIn('referred_by', $referrerIds)
        ->count();

      // Hitung Agen Subscribed (Join companies.id ke agent_subscriptions.company_id)
      $subscribed_agents = DB::table('companies')
        ->join('agent_subscriptions', 'companies.id', '=', 'agent_subscriptions.company_id')
        ->where('companies.type', 'agent')
        ->whereIn('companies.referred_by', $referrerIds)
        ->whereNotNull('agent_subscriptions.package_id')
        ->count();

      return [
        'id' => $network->id,
        'name' => $network->name,
        'username' => $network->username,
        'email' => $network->email,
        'phone' => $network->phone,
        'tier' => $network->tier,
        'created_at' => $network->created_at,
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

  // Bagian fungsi approvals yang diperbarui:
  public function approvals(Request $request)
  {
    $user = $request->user();
    $tierFilter = $request->query('tier');

    $query = AffiliateProfile::where('upline_id', $user->id)
      ->where('status', 'pending')
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
        'name' => $profile->user->name ?? '-',
        'email' => $profile->user->email ?? '-',
        'username' => $profile->user->username ?? '-',
        'registered_at' => $profile->created_at ? $profile->created_at->format('Y-m-d') : '-',
      ];
    });

    return Inertia::render('affiliate/dashboard/network/approvals', [
      'pending_approvals' => $pending
    ]);
  }

  public function approve(Request $request, $id)
  {
    $profile = AffiliateProfile::findOrFail($id);

    if ($profile->upline_id !== $request->user()->id) {
      abort(403);
    }

    $profile->update([
      'status' => 'approved',
      'approved_at' => now(),
    ]);

    return back()->with('success', 'Affiliate has been approved.');
  }

  public function reject(Request $request, $id)
  {
    $profile = AffiliateProfile::findOrFail($id);

    if ($profile->upline_id !== $request->user()->id) {
      abort(403);
    }

    $profile->update([
      'status' => 'rejected',
    ]);

    return back()->with('success', 'Affiliate has been rejected.');
  }
}
