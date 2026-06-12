<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Enums\CompanyType;
use App\Enums\PaymentStatus;
use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Media;
use App\Models\Payment;
use App\Models\Tour;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function show()
    {
        $totals = [
            'users' => User::count(),
            'companies' => Company::count(),
            'vendors' => Company::where('type', CompanyType::VENDOR)->count(),
            'agents' => Company::where('type', CompanyType::AGENT)->count(),
            'affiliates' => AffiliateProfile::count(),
            'tours' => Tour::count(),
            'bookings' => Booking::count(),
            'media' => Media::count(),
        ];

        $pendingWithdrawalsCount = Withdrawal::whereIn('status', [
            WithdrawalStatus::PENDING,
            WithdrawalStatus::PROCESSING,
        ])->count();

        $pendingPaymentsCount = Payment::whereIn('status', [
            PaymentStatus::UNPAID,
            PaymentStatus::PENDING,
        ])->count();

        $totalRevenue = (float) Booking::where('status', BookingStatus::FULL_PAYMENT)
            ->sum(DB::raw('COALESCE((SELECT SUM(booking_passengers.price_amount) FROM booking_passengers WHERE booking_passengers.booking_id = bookings.id), bookings.total_price)'));

        $monthlyRevenue = (float) Booking::where('status', BookingStatus::FULL_PAYMENT)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->sum(DB::raw('COALESCE((SELECT SUM(booking_passengers.price_amount) FROM booking_passengers WHERE booking_passengers.booking_id = bookings.id), bookings.total_price)'));

        $recentUsers = User::latest()->take(5)->get()->map(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'photo_url' => $u->photo_url,
            'created_at' => $u->created_at?->diffForHumans(),
        ]);

        $recentCompanies = Company::latest()->take(5)->get()->map(fn (Company $c) => [
            'id' => $c->id,
            'name' => $c->name,
            'type' => $c->type?->value,
            'username' => $c->username,
            'created_at' => $c->created_at?->diffForHumans(),
        ]);

        $chartData = [];
        for ($i = 11; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $revenue = (float) Booking::where('status', BookingStatus::FULL_PAYMENT)
                ->whereYear('created_at', $monthDate->year)
                ->whereMonth('created_at', $monthDate->month)
                ->sum(DB::raw('COALESCE((SELECT SUM(booking_passengers.price_amount) FROM booking_passengers WHERE booking_passengers.booking_id = bookings.id), bookings.total_price)'));

            $bookingsCount = Booking::whereYear('created_at', $monthDate->year)
                ->whereMonth('created_at', $monthDate->month)
                ->count();

            $chartData[] = [
                'month' => $monthDate->format('M'),
                'revenue' => $revenue,
                'bookings' => $bookingsCount,
            ];
        }

        return Inertia::render('admin/home/index', [
            'totals' => $totals,
            'pendingWithdrawalsCount' => $pendingWithdrawalsCount,
            'pendingPaymentsCount' => $pendingPaymentsCount,
            'totalRevenue' => $totalRevenue,
            'monthlyRevenue' => $monthlyRevenue,
            'recentUsers' => $recentUsers,
            'recentCompanies' => $recentCompanies,
            'chartData' => $chartData,
        ]);
    }
}
