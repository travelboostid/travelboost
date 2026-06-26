<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\BookingStatus;
use App\Enums\CompanyType;
use App\Enums\VendorAgentPartnerStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Company;
use Illuminate\Contracts\Database\Query\Expression;
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
        $fullPaymentStatus = BookingStatus::FULL_PAYMENT->value;
        $salesAmountExpression = $this->salesAmountExpression();

        $baseQuery = Booking::query()
            ->where($companyColumn, $company->id)
            ->where('status', $fullPaymentStatus);

        $totalRevenue = (float) (clone $baseQuery)->sum($salesAmountExpression);
        $totalPax = (int) (clone $baseQuery)->sum(DB::raw('pax_adult + pax_child + pax_infant'));

        $commissionQuery = $wallet
            ? $wallet->transactions()
                ->whereIn('meta->type', [
                    'booking-agent-commission',
                    'booking agent commission',
                ])
            : null;

        $totalCommission = $commissionQuery
            ? abs((float) (clone $commissionQuery)
                ->when(! $isVendor, fn ($query) => $query->where('amount', '>', 0))
                ->when($isVendor, fn ($query) => $query->where('amount', '<', 0))
                ->sum('amount'))
            : 0.0;

        $monthlyCommission = $commissionQuery
            ? abs((float) (clone $commissionQuery)
                ->when(! $isVendor, fn ($query) => $query->where('amount', '>', 0))
                ->when($isVendor, fn ($query) => $query->where('amount', '<', 0))
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->sum('amount'))
            : 0.0;
        $yearlyCommission = $commissionQuery
            ? abs((float) (clone $commissionQuery)
                ->when(! $isVendor, fn ($query) => $query->where('amount', '>', 0))
                ->when($isVendor, fn ($query) => $query->where('amount', '<', 0))
                ->whereYear('created_at', now()->year)
                ->sum('amount'))
            : 0.0;

        $totalProfit = $isVendor ? max(0, $totalRevenue - $totalCommission) : $totalCommission;

        $monthlyRevenue = (float) (clone $baseQuery)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->sum($salesAmountExpression);
        $monthlyPax = (int) (clone $baseQuery)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->sum(DB::raw('pax_adult + pax_child + pax_infant'));

        $yearlyRevenue = (float) (clone $baseQuery)
            ->whereYear('created_at', now()->year)
            ->sum($salesAmountExpression);
        $yearlyPax = (int) (clone $baseQuery)
            ->whereYear('created_at', now()->year)
            ->sum(DB::raw('pax_adult + pax_child + pax_infant'));

        $monthlyProfit = $isVendor ? max(0, $monthlyRevenue - $monthlyCommission) : $monthlyCommission;

        $networkCount = (int) (clone $baseQuery)->distinct('user_id')->count('user_id');
        $activeAgentsCount = $isVendor
            ? $company->agentPartners()
                ->where('status', VendorAgentPartnerStatus::ACTIVE)
                ->count()
            : 0;

        $credit = $company->aiCredit;

        $stats = [
            'sales' => [
                'total' => [
                    'idr' => $totalRevenue,
                    'pax' => $totalPax,
                ],
                'monthly' => [
                    'idr' => $monthlyRevenue,
                    'pax' => $monthlyPax,
                ],
                'yearly' => [
                    'idr' => $yearlyRevenue,
                    'pax' => $yearlyPax,
                ],
            ],
            'commission' => [
                'total' => $totalProfit,
                'monthly' => $monthlyProfit,
                'yearly' => $isVendor ? $totalCommission : $yearlyCommission,
            ],
            'counters' => [
                'customers' => $networkCount,
                'active_agents' => $activeAgentsCount,
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
                ->sum($salesAmountExpression);

            $chartData[] = [
                'month' => $monthDate->format('M'),
                'sales' => $monthSales,
            ];
        }

        $topDestinations = Booking::query()
            ->join('tours', 'bookings.tour_id', '=', 'tours.id')
            ->where('bookings.'.$companyColumn, $company->id)
            ->where('bookings.status', $fullPaymentStatus)
            ->select(
                'tours.id',
                'tours.code',
                'tours.name',
                DB::raw('SUM(bookings.pax_adult + bookings.pax_child + bookings.pax_infant) as pax'),
                DB::raw('SUM('.$this->salesAmountSql().') as revenue')
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
                ->where('bookings.status', $fullPaymentStatus)
                ->select(
                    'companies.name',
                    DB::raw('SUM(bookings.pax_adult + bookings.pax_child + bookings.pax_infant) as pax'),
                    DB::raw('SUM('.$this->salesAmountSql().') as revenue')
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

    private function salesAmountExpression(): Expression
    {
        return DB::raw($this->salesAmountSql());
    }

    private function salesAmountSql(): string
    {
        return 'COALESCE((SELECT SUM(booking_passengers.price_amount) FROM booking_passengers WHERE booking_passengers.booking_id = bookings.id), bookings.total_price)';
    }
}
