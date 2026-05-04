<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class HomeController extends Controller
{
  public function index(Company $company)
  {
    $agentSubscription = $company->agentSubscription()->with('package')->latest()->first();

    $unreadNotificationsCount = $company->unreadNotifications()->count();
    $recentNotifications = $company->notifications()->latest()->take(5)->get();

    $isVendor = $company->type === 'vendor';
    $companyColumn = $isVendor ? 'vendor_id' : 'agent_id';

    $totalSales = DB::table('bookings')->where($companyColumn, $company->id)->where('status', 'paid')->sum('grand_total');
    $totalPax = DB::table('bookings')->where($companyColumn, $company->id)->where('status', 'paid')->sum(DB::raw('pax_adult + pax_child + pax_infant'));
    $totalOrder = DB::table('bookings')->where($companyColumn, $company->id)->where('status', 'paid')->count();

    $monthlySales = DB::table('bookings')->where($companyColumn, $company->id)->where('status', 'paid')->whereYear('created_at', now()->year)->whereMonth('created_at', now()->month)->sum('grand_total');
    $monthlyPax = DB::table('bookings')->where($companyColumn, $company->id)->where('status', 'paid')->whereYear('created_at', now()->year)->whereMonth('created_at', now()->month)->sum(DB::raw('pax_adult + pax_child + pax_infant'));

    $profitColumn = $isVendor ? 'grand_total - commission_amount' : 'commission_amount';
    $totalProfit = DB::table('bookings')->where($companyColumn, $company->id)->where('status', 'paid')->sum(DB::raw($profitColumn));
    $monthlyProfit = DB::table('bookings')->where($companyColumn, $company->id)->where('status', 'paid')->whereYear('created_at', now()->year)->whereMonth('created_at', now()->month)->sum(DB::raw($profitColumn));

    $customersCount = DB::table('users')->where('company_id', $company->id)->count();
    $agentsCount = $isVendor ? DB::table('vendor_agent_partners')->where('vendor_id', $company->id)->where('status', 'active')->count() : 0;

    $walletBalance = DB::table('wallets')->where('holder_type', 'company')->where('holder_id', $company->id)->where('slug', 'main')->value('balance') ?? 0;

    $aiCreditBalance = DB::table('ai_credits')->where('company_id', $company->id)->value('balance') ?? 0;

    $stats = [
      'sales' => [
        'total' => ['idr' => (float)$totalSales, 'pax' => (int)$totalPax, 'order' => (int)$totalOrder],
        'monthly' => ['idr' => (float)$monthlySales, 'pax' => (int)$monthlyPax],
      ],
      'commission' => [
        'total' => (float)$totalProfit,
        'monthly' => (float)$monthlyProfit,
      ],
      'counters' => [
        'agents' => $agentsCount,
        'customers' => $customersCount,
      ],
      'ai_credit' => (float)$aiCreditBalance,
      'wallet' => [
        'balance' => (float)$walletBalance
      ]
    ];

    $chartData = collect(range(1, 12))->map(function ($month) use ($companyColumn, $company) {
      $sum = DB::table('bookings')
        ->where($companyColumn, $company->id)
        ->where('status', 'paid')
        ->whereYear('created_at', now()->year)
        ->whereMonth('created_at', $month)
        ->sum('grand_total');

      return [
        'month' => now()->month($month)->format('M'),
        'sales' => (float) $sum
      ];
    })->toArray();

    $topDestinations = DB::table('bookings')
      ->join('tours', 'bookings.tour_id', '=', 'tours.id')
      ->where('bookings.' . $companyColumn, $company->id)
      ->where('bookings.status', 'paid')
      ->select(
        'tours.code',
        'tours.name',
        DB::raw('SUM(bookings.pax_adult + bookings.pax_child + bookings.pax_infant) as pax'),
        DB::raw('SUM(bookings.grand_total) as revenue'),
        DB::raw('SUM(bookings.commission_amount) as commission')
      )
      ->groupBy('tours.id', 'tours.code', 'tours.name')
      ->orderByDesc('pax')
      ->limit(10)
      ->get()
      ->toArray();

    $topAgents = [];
    if ($isVendor) {
      $topAgents = DB::table('bookings')
        ->join('companies', 'bookings.agent_id', '=', 'companies.id')
        ->where('bookings.vendor_id', $company->id)
        ->where('bookings.status', 'paid')
        ->select(
          'companies.name',
          DB::raw('SUM(bookings.pax_adult + bookings.pax_child + bookings.pax_infant) as pax'),
          DB::raw('SUM(bookings.grand_total) as revenue'),
          DB::raw('SUM(bookings.grand_total - bookings.commission_amount) as profit')
        )
        ->groupBy('companies.id', 'companies.name')
        ->orderByDesc('pax')
        ->limit(10)
        ->get()
        ->toArray();
    }

    $credit = $company->aiCredit()->first() ?: (object)['balance' => 0, 'limit' => 0];

    return Inertia::render('companies/dashboard/home/index', [
      'agentSubscription' => $agentSubscription,
      'stats' => $stats,
      'chartData' => $chartData,
      'topDestinations' => $topDestinations,
      'topAgents' => $topAgents,
      'recentNotifications' => $recentNotifications,
      'unreadNotificationsCount' => $unreadNotificationsCount,
      'ai_credit' => $credit,
    ]);
  }
}
