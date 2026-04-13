<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Pagination\LengthAwarePaginator;

class AgentController extends Controller
{
  public function index(Request $request)
  {
    $user = $request->user()->load('affiliateProfile', 'roles');

    // Deteksi apakah user ini Master Affiliate (MA) atau Partner
    $roles = $user->roles->pluck('name')->toArray();
    $tier = $user->affiliateProfile?->tier;
    $isMaster = in_array('master_affiliate', $roles) || in_array('master-affiliate', $roles) ||
      in_array('partner', $roles) || $tier === 'master_affiliate' || $tier === 'master-affiliate' || $tier === 'partner';

    $sortField = $request->input('sort', 'created_at');
    $sortOrder = $request->input('order', 'desc');
    $limit = $request->input('limit', 10);
    $page = $request->input('page', 1);

    // ===================================================================================
    // [DEPLOYMENT] UNCOMMENT QUERY ASLI DI BAWAH INI DAN HAPUS BAGIAN DUMMY
    // ===================================================================================
    /*
        // Asumsi: 
        // 1. Kolom referal di tabel users bernama 'referred_by'
        // 2. Relasi di model User: public function referrer() { return $this->belongsTo(User::class, 'referred_by'); }
        // 3. Relasi di model Company: public function activeSubscription() { return $this->hasOne(AgentSubscription::class)->where('ended_at', '>', now()); }
        // 4. Relasi di model AgentSubscription: public function package() { return $this->belongsTo(AgentSubscriptionPackage::class); }

        $query = \App\Models\User::whereHas('roles', function($q) {
            $q->where('name', 'agent');
        });

        if ($isMaster) {
            // MA: Ambil agen miliknya dan agen milik affiliator di bawahnya
            $downlineIds = \App\Models\AffiliateProfile::where('upline_id', $user->id)->pluck('user_id')->toArray();
            $allowedIds = array_merge([$user->id], $downlineIds);
            $query->whereIn('referred_by', $allowedIds);
        } else {
            // Affiliator: Hanya agen miliknya
            $query->where('referred_by', $user->id);
        }

        $query->with(['referrer:id,name,username', 'company.activeSubscription.package']);
        
        $agentsData = $query->orderBy($sortField, $sortOrder)->paginate($limit)->withQueryString();

        $agentsData->getCollection()->transform(function ($agent) use ($user) {
            $subscription = $agent->company?->activeSubscription;
            $package = $subscription?->package;
            
            return [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email,
                'status' => $subscription ? 'Subscribed' : 'Registered',
                'package' => $package ? $package->name : '-',
                'subscription_date' => $subscription ? $subscription->started_at->format('Y-m-d') : '-',
                'potential_commission' => $package ? ($package->price * 0.10) : 0, // Misal komisi 10%
                'affiliator_name' => $agent->referred_by === $user->id ? 'Direct (Me)' : $agent->referrer?->name,
                'created_at' => $agent->created_at->format('Y-m-d H:i:s'),
            ];
        });

        $agents = $agentsData;
        */

    // ===================================================================================
    // [DUMMY INJECTION] HAPUS BAGIAN INI SAAT DEPLOYMENT
    // ===================================================================================
    $dummyItems = collect();
    $statuses = ['Registered', 'Pending Subscription', 'Subscribed'];
    $packages = ['Basic', 'Pro', 'Enterprise'];

    for ($i = 1; $i <= 35; $i++) {
      $statusIndex = ($i * 7) % 3;
      $status = $statuses[$statusIndex];
      $isSubscribed = $status === 'Subscribed';
      $isPending = $status === 'Pending Subscription';

      $potentialComm = $isSubscribed ? (($i * 15) % 50 + 10) * 10000 : ($isPending ? 150000 : 0);

      $dummyItems->push([
        'id' => $i,
        'name' => 'Agen Travel ' . $i,
        'email' => 'agen' . $i . '@example.com',
        'status' => $status,
        'package' => $isSubscribed ? $packages[($i * 3) % 3] : '-',
        'subscription_date' => $isSubscribed ? now()->subDays(($i * 13) % 60)->format('Y-m-d') : '-',
        'potential_commission' => $potentialComm,
        'affiliator_name' => $isMaster ? ($i % 3 === 0 ? 'Direct (Me)' : 'Affiliator Network ' . ($i % 5)) : $user->name,
        'created_at' => now()->subDays($i * 2)->format('Y-m-d H:i:s'),
      ]);
    }

    $sortedItems = $sortOrder === 'desc'
      ? $dummyItems->sortByDesc($sortField)->values()
      : $dummyItems->sortBy($sortField)->values();

    $slicedItems = $sortedItems->slice(($page - 1) * $limit, $limit)->values();
    $agents = new LengthAwarePaginator($slicedItems, $dummyItems->count(), $limit, $page, [
      'path' => $request->url(),
      'query' => $request->query(),
    ]);
    // ===================================================================================

    return Inertia::render('affiliate/dashboard/agent/list', [
      'agents' => $agents,
      'isMaster' => $isMaster,
      'filters' => $request->only(['sort', 'order', 'limit']),
    ]);
  }
}
