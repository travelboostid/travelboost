<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $from = $request->input('from')
          ? Carbon::parse($request->input('from'))->startOfDay()
          : now()->subMonth()->startOfDay();

        $to = $request->input('to')
          ? Carbon::parse($request->input('to'))->endOfDay()
          : now()->endOfDay();

        // ====================================================================
        // [DEPLOYMENT] UNCOMMENT QUERY DI BAWAH DAN HAPUS BLOK DUMMY SAAT LIVE
        // ====================================================================
        /*
            $payments = Payment::with('payable')
                ->where('owner_type', get_class($user))
                ->where('owner_id', $user->id)
                ->whereBetween('created_at', [$from, $to])
                ->latest()
                ->get();
            */

        // ====================================================================
        // [DUMMY INJECTION] HAPUS SAAT DEPLOYMENT
        // ====================================================================
        $payments = collect([
            [
                'id' => 'PAY-001',
                'amount' => 100000,
                'status' => 'paid',
                'provider' => 'Midtrans',
                'payment_method' => 'Gopay',
                'created_at' => now()->subDays(2),
                'paid_at' => now()->subDays(2),
                'payable_type' => 'WalletTopup',
            ],
            [
                'id' => 'PAY-002',
                'amount' => 250000,
                'status' => 'pending',
                'provider' => 'Midtrans',
                'payment_method' => 'Bank Transfer',
                'created_at' => now()->subHours(5),
                'paid_at' => null,
                'payable_type' => 'WalletTopup',
            ],
        ]);
        // ====================================================================

        return Inertia::render('affiliate/dashboard/fund/payments/index', [
            'payments' => $payments,
            'filters' => [
                'from' => $request->input('from') ? $from->toDateString() : null,
                'to' => $request->input('to') ? $to->toDateString() : null,
            ],
        ]);
    }
}
