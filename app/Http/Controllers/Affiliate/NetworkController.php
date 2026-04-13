<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class NetworkController extends Controller
{
  public function index(Request $request)
  {
    $user = $request->user();

    $sortField = $request->input('sort', 'created_at');
    $sortOrder = $request->input('order', 'desc');
    $limit = $request->input('limit', 10);
    $period = $request->input('period', 'monthly');

    // Multiplier untuk simulasi filter waktu (HAPUS saat deployment)
    $multiplier = $period === 'yearly' ? 12 : ($period === 'all_time' ? 24 : 1);

    // ===================================================================================
    // [DEPLOYMENT] UNCOMMENT QUERY ASLI DI BAWAH INI DAN SESUAIKAN FILTER PERIODENYA
    // ===================================================================================
    /*
        $query = AffiliateProfile::where('upline_id', $user->id)
            ->where('status', 'approved')
            ->with('user:id,name,username,email,created_at')
            ->withCount([
                // Menghitung total agen yang diundang
                'user as invited_count' => function ($q) use ($period) {
                    $q->from('users')->whereColumn('users.referred_by', 'affiliate_profiles.user_id');
                    // Tambahkan filter $period di sini kalau perlu aja (misal where('created_at', '>=', startOfMonth))
                },
                // Menghitung agen yang berhasil Subscribe (terhubung ke company -> agent_subscriptions)
                'user as subscribed_count' => function ($q) use ($period) {
                    $q->from('users')
                      ->whereColumn('users.referred_by', 'affiliate_profiles.user_id')
                      ->whereHas('company.agentSubscriptions', function($subQuery) {
                          $subQuery->where('ended_at', '>', now()); // Asumsi subscription masih aktif
                      });
                }
            ]);

        $affiliates = $query->orderBy($sortField, $sortOrder)->paginate($limit)->withQueryString();
        */

    // ===================================================================================
    // [DUMMY INJECTION] HAPUS QUERY DUMMY INI SAAT DEPLOYMENT
    // ===================================================================================
    $affiliates = AffiliateProfile::where('upline_id', $user->id)
      ->where('status', 'approved')
      ->with('user:id,name,username,email,created_at')
      ->orderBy($sortField, $sortOrder)
      ->paginate($limit)
      ->withQueryString();

    $affiliates->getCollection()->transform(function ($affiliate) use ($multiplier) {
      $baseInvited = ($affiliate->id * 23) % 80 + 20;
      $baseSubscribed = ($affiliate->id * 7) % $baseInvited;

      $affiliate->invited_count = $baseInvited * $multiplier;
      $affiliate->subscribed_count = $baseSubscribed * $multiplier;
      return $affiliate;
    });
    // ===================================================================================

    return Inertia::render('affiliate/dashboard/affiliate/list', [
      'affiliates' => $affiliates,
      'filters' => $request->only(['sort', 'order', 'limit', 'period', 'top']),
    ]);
  }

  public function getChartData(Request $request)
  {
    $user = $request->user();
    $period = $request->input('period', 'monthly');
    $top = $request->input('top', 5);

    $multiplier = $period === 'yearly' ? 12 : ($period === 'all_time' ? 24 : 1);

    // ===================================================================================
    // [DEPLOYMENT] UNCOMMENT QUERY ASLI SAAT DEPLOYMENT 
    // ===================================================================================
    /*
        $data = AffiliateProfile::where('upline_id', $user->id)
            ->where('status', 'approved')
            ->with('user:id,username')
            ->withCount([
                'user as invited_count' => function ($q) {
                    $q->from('users')->whereColumn('users.referred_by', 'affiliate_profiles.user_id');
                },
                'user as subscribed_count' => function ($q) {
                    $q->from('users')->whereColumn('users.referred_by', 'affiliate_profiles.user_id')
                      ->whereHas('company.agentSubscriptions', function($subQuery) {
                          $subQuery->where('ended_at', '>', now());
                      });
                }
            ])
            ->orderByDesc('subscribed_count') // Ambil best performance
            ->take($top)
            ->get()
            ->map(function($affiliate) {
                return [
                    'name' => $affiliate->user->username,
                    'invited' => $affiliate->invited_count,
                    'subscribed' => $affiliate->subscribed_count,
                ];
            });
        return response()->json($data);
        */

    // ===================================================================================
    // [DUMMY INJECTION] HAPUS BLOK DUMMY INI SAAT DEPLOYMENT
    // ===================================================================================
    $data = AffiliateProfile::where('upline_id', $user->id)
      ->where('status', 'approved')
      ->with('user:id,username')
      ->take($top)
      ->get()
      ->map(function ($affiliate) use ($multiplier) {
        $baseInvited = ($affiliate->id * 23) % 80 + 20;
        $baseSubscribed = ($affiliate->id * 7) % $baseInvited;

        return [
          'name' => $affiliate->user->username,
          'invited' => $baseInvited * $multiplier,
          'subscribed' => $baseSubscribed * $multiplier,
        ];
      });

    return response()->json($data);
    // ===================================================================================
  }

  public function approvals(Request $request)
  {
    $user = $request->user();

    $pending = AffiliateProfile::where('upline_id', $user->id)
      ->where('status', 'pending')
      ->with('user')
      ->orderBy('created_at', 'desc')
      ->paginate(10);

    return Inertia::render('affiliate/dashboard/affiliate/approvals', [
      'pendingAffiliates' => $pending
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
    $profile->update(['status' => 'rejected']);
    return back()->with('success', 'Affiliate application rejected.');
  }
}
