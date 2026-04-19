<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Inertia\Inertia;

class HomeController extends Controller
{
  public function index(Company $company)
  {
    $agentSubscription = $company->agentSubscription()->with('package')->latest()->first();

    // Dummy Data
    $stats = [
      'sales' => [
        'total' => ['idr' => 250000000, 'pax' => 120, 'order' => 45],
        'monthly' => ['idr' => 45000000, 'pax' => 18, 'order' => 8],
      ],
      'commission' => [
        'total' => 25000000,
        'monthly' => 4500000,
      ],
      'counters' => [
        'agents' => 15,
        'customers' => 156,
      ],
    ];

    $chartData = [
      ['month' => 'Jan', 'sales' => 12000000],
      ['month' => 'Feb', 'sales' => 15000000],
      ['month' => 'Mar', 'sales' => 8000000],
      ['month' => 'Apr', 'sales' => 22000000],
      ['month' => 'May', 'sales' => 30000000],
      ['month' => 'Jun', 'sales' => 28000000],
      ['month' => 'Jul', 'sales' => 35000000],
      ['month' => 'Aug', 'sales' => 40000000],
      ['month' => 'Sep', 'sales' => 32000000],
      ['month' => 'Oct', 'sales' => 45000000],
      ['month' => 'Nov', 'sales' => 38000000],
      ['month' => 'Dec', 'sales' => 55000000],
    ];

    $topDestinations = collect(range(1, 10))->map(fn($i) => [
      'code' => 'TR-00' . $i,
      'name' => 'Popular Destination ' . $i,
      'pax' => rand(10, 50),
      'revenue' => rand(5000000, 20000000),
      'commission' => rand(500000, 2000000),
    ]);

    $topAgents = collect(range(1, 10))->map(fn($i) => [
      'name' => 'Partner Agent ' . $i,
      'pax' => rand(20, 100),
      'revenue' => rand(10000000, 50000000),
      'profit' => rand(1000000, 5000000),
    ]);

    return Inertia::render('companies/dashboard/home/index', [
      'agentSubscription' => $agentSubscription,
      'stats' => $stats,
      'chartData' => $chartData,
      'topDestinations' => $topDestinations,
      'topAgents' => $topAgents,
    ]);
  }
}
