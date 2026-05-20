<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\BookingStatus;
use App\Enums\CompanyType;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Company;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Company $company)
    {
        $company->load([
            'aiCredit',
            'agentSubscription.package',
        ]);

        $wallet = $company->wallet;
        $walletBalance = (float) ($wallet?->balance ?? 0);

        $unreadNotificationsCount = $company->unreadNotifications()->count();
        $recentNotifications = $company->notifications()->latest()->get();

        $companyType = $company->type instanceof \BackedEnum ? $company->type->value : $company->type;
        $isVendor = $companyType === CompanyType::VENDOR->value;

        $companyColumn = $isVendor ? 'vendor_id' : 'agent_id';
        $status = BookingStatus::FULL_PAYMENT->value;

        $baseQuery = Booking::where($companyColumn, $company->id)->where('status', $status);

        $totalRevenue = (float) (clone $baseQuery)->sum('grand_total');
        $totalPax = (int) (clone $baseQuery)->sum(DB::raw('pax_adult + pax_child + pax_infant'));

        $profitColumn = $isVendor ? DB::raw('grand_total - commission_amount') : 'commission_amount';
        $totalProfit = (float) (clone $baseQuery)->sum($profitColumn);

        $monthlyProfit = (float) (clone $baseQuery)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->sum($profitColumn);

        $networkCount = (int) (clone $baseQuery)->distinct('user_id')->count('user_id');

        $credit = $company->aiCredit;

        $stats = [
            'sales' => [
                'total' => [
                    'idr' => $totalRevenue,
                    'pax' => $totalPax,
                ],
            ],
            'commission' => [
                'total' => $totalProfit,
                'monthly' => $monthlyProfit,
            ],
            'counters' => [
                'customers' => $networkCount,
            ],
            'wallet' => [
                'balance' => $walletBalance,
            ],
            'ai_credit' => (float) ($credit->balance ?? 0),
        ];

        $chartData = [];
        for ($i = 11; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $monthSales = (float) (clone $baseQuery)
                ->whereYear('created_at', $monthDate->year)
                ->whereMonth('created_at', $monthDate->month)
                ->sum('grand_total');

            $chartData[] = [
                'month' => $monthDate->format('M'),
                'sales' => $monthSales,
            ];
        }

        $topDestinations = Booking::query()
            ->join('tours', 'bookings.tour_id', '=', 'tours.id')
            ->where('bookings.'.$companyColumn, $company->id)
            ->where('bookings.status', $status)
            ->select(
                'tours.id',
                'tours.code',
                'tours.name',
                DB::raw('SUM(bookings.pax_adult + bookings.pax_child + bookings.pax_infant) as pax'),
                DB::raw('SUM(bookings.grand_total) as revenue')
            )
            ->groupBy('tours.id', 'tours.code', 'tours.name')
            ->orderByDesc('pax')
            ->limit(10)
            ->get();

        $topAgents = [];
        if ($isVendor) {
            $topAgents = Booking::query()
                ->join('companies', 'bookings.agent_id', '=', 'companies.id')
                ->where('bookings.vendor_id', $company->id)
                ->where('bookings.status', $status)
                ->select(
                    'companies.name',
                    DB::raw('SUM(bookings.pax_adult + bookings.pax_child + bookings.pax_infant) as pax'),
                    DB::raw('SUM(bookings.grand_total) as revenue')
                )
                ->groupBy('companies.id', 'companies.name')
                ->orderByDesc('pax')
                ->limit(10)
                ->get();
        }

        return Inertia::render('companies/dashboard/home/index', [
            'company' => $company,
            'stats' => $stats,
            'chartData' => $chartData,
            'topDestinations' => $topDestinations,
            'topAgents' => $topAgents,
            'unreadNotificationsCount' => $unreadNotificationsCount,
            'recentNotifications' => $recentNotifications,
            'agentSubscription' => $company->agentSubscription,
            'aiCredit' => [
                'balance' => (float) ($credit->balance ?? 0),
                'limit' => (float) ($credit->limit ?? 0),
            ],
        ]);
    }
}
