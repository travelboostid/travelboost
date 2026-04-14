<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AgentController extends Controller
{
  public function index(Request $request)
  {
    $user = Auth::user();

    // 1. Dapatkan profil affiliate untuk tahu tier-nya
    $profile = DB::table('affiliate_profiles')->where('user_id', $user->id)->first();
    $tier = $profile ? $profile->tier : 'affiliate';
    $isMaster = in_array($tier, ['partner', 'master_affiliate', 'master-affiliate']);

    // 2. Dapatkan persentase komisi berdasarkan tier
    $commissionRate = DB::table('affiliate_commission_rates')->where('tier', $tier)->value('percentage') ?? 0;

    $sortField = $request->input('sort', 'created_at');
    $sortOrder = $request->input('order', 'desc');
    $limit = $request->input('limit', 10);

    // 3. LOGIKA KEDALAMAN JARINGAN (Penentu Pengundang Agen)
    $allowedIds = [$user->id]; // Termasuk agen yang diundang sendiri

    if ($tier === 'partner') {
      // Level 1: MA atau Affiliate yang langsung di bawah Partner
      $level1_Ids = DB::table('affiliate_profiles')
        ->where('upline_id', $user->id)
        ->pluck('user_id')
        ->toArray();

      // Level 2: Affiliate yang berada di bawah MA
      $level2_Ids = [];
      if (!empty($level1_Ids)) {
        $level2_Ids = DB::table('affiliate_profiles')
          ->whereIn('upline_id', $level1_Ids)
          ->pluck('user_id')
          ->toArray();
      }

      // Gabungkan semua ID
      $allowedIds = array_merge($allowedIds, $level1_Ids, $level2_Ids);
    } elseif (in_array($tier, ['master_affiliate', 'master-affiliate'])) {
      // MA hanya membaca 1 Level ke bawah (Affiliate miliknya)
      $level1_Ids = DB::table('affiliate_profiles')
        ->where('upline_id', $user->id)
        ->pluck('user_id')
        ->toArray();

      $allowedIds = array_merge($allowedIds, $level1_Ids);
    }

    // 4. Query utama ke tabel Companies -> Relasi ke Package dan Referrer
    $query = DB::table('companies')
      ->select(
        'companies.id',
        'companies.name',
        'companies.email',
        'companies.created_at',
        'companies.referred_by',
        'users.name as referrer_name',
        'agent_subscriptions.started_at',
        'agent_subscriptions.ended_at',
        'agent_subscription_packages.name as package_name',
        'agent_subscription_packages.price'
      )
      ->leftJoin('users', 'companies.referred_by', '=', 'users.id')
      // Join ke agent_subscriptions menggunakan company_id (Sesuai skema database terakhir)
      ->leftJoin('agent_subscriptions', function ($join) {
        $join->on('companies.id', '=', 'agent_subscriptions.company_id')
          ->whereRaw('agent_subscriptions.id = (SELECT MAX(id) FROM agent_subscriptions WHERE company_id = companies.id)');
      })
      ->leftJoin('agent_subscription_packages', 'agent_subscriptions.package_id', '=', 'agent_subscription_packages.id')
      ->where('companies.type', 'agent')
      ->whereIn('companies.referred_by', $allowedIds);

    // 5. Pemetaan Sorting
    $sortColumn = 'companies.' . $sortField;
    if (in_array($sortField, ['status', 'package'])) {
      $sortColumn = 'agent_subscription_packages.name';
    } elseif ($sortField === 'subscription_date') {
      $sortColumn = 'agent_subscriptions.started_at';
    } elseif ($sortField === 'potential_commission') {
      $sortColumn = 'agent_subscription_packages.price';
    } elseif ($sortField === 'affiliator_name') {
      $sortColumn = 'users.name';
    }

    $agentsData = $query->orderBy($sortColumn, $sortOrder)->paginate($limit)->withQueryString();

    // 6. Format data sebelum dilempar ke Frontend
    $agentsData->getCollection()->transform(function ($agent) use ($user, $commissionRate) {
      $isSubscribed = $agent->ended_at && Carbon::parse($agent->ended_at)->isFuture();

      // Komisi: (Harga Paket * Persentase Tier) / 100
      $potentialComm = $agent->price ? $agent->price * ($commissionRate / 100) : 0;

      $status = 'Registered';
      if ($isSubscribed) {
        $status = 'Subscribed';
      } elseif ($agent->package_name) {
        $status = 'Expired';
      }

      return [
        'id' => $agent->id,
        'name' => $agent->name,
        'email' => $agent->email,
        'status' => $status,
        'package' => $agent->package_name ?? '-',
        'subscription_date' => $agent->started_at ? Carbon::parse($agent->started_at)->format('Y-m-d') : '-',
        'potential_commission' => $potentialComm,
        'affiliator_name' => $agent->referred_by === $user->id ? 'Direct (Me)' : $agent->referrer_name,
        'created_at' => Carbon::parse($agent->created_at)->format('Y-m-d'),
      ];
    });

    return Inertia::render('affiliate/dashboard/agent/list', [
      'agents' => $agentsData,
      'isMaster' => $isMaster,
      'filters' => $request->only(['sort', 'order', 'limit']),
    ]);
  }
}
