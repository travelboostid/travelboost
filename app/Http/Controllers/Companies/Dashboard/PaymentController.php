<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Company $company, Request $request)
    {
        $from = $request->filled('from')
            ? Carbon::parse($request->input('from'))->startOfDay()
            : now()->subMonth()->startOfDay();

        $to = $request->filled('to')
            ? Carbon::parse($request->input('to'))->endOfDay()
            : now()->endOfDay();

        $status = $request->input('status');
        if (! in_array($status, ['unpaid', 'pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded'], true)) {
            $status = null;
        }

        $type = $request->input('type', 'all');
        $allowedTypes = [
            'all',
            'wallet-topup-payment',
            'agent-subscription-payment',
            'ai-credit-topup-payment',
        ];
        if (! in_array($type, $allowedTypes, true)) {
            $type = 'all';
        }

        $sort = $request->input('sort', '-created_at');
        if (! in_array($sort, ['-created_at', 'created_at'], true)) {
            $sort = '-created_at';
        }

        $periodQuery = $company->payments()
            ->whereBetween('created_at', [$from, $to]);

        $stats = [
            'total_count' => (clone $periodQuery)->count(),
            'total_amount' => (float) (clone $periodQuery)->sum('amount'),
            'paid_count' => (clone $periodQuery)->where('status', PaymentStatus::PAID)->count(),
            'pending_count' => (clone $periodQuery)
                ->whereIn('status', [PaymentStatus::PENDING, PaymentStatus::UNPAID])
                ->count(),
        ];

        $payments = (clone $periodQuery)
            ->with('payable')
            ->when($status, fn (Builder $query) => $query->where('status', $status))
            ->when($type !== 'all', fn (Builder $query) => $query->where('payable_type', $type))
            ->when(
                $sort === '-created_at',
                fn (Builder $query) => $query->latest(),
                fn (Builder $query) => $query->oldest(),
            )
            ->get();

        return Inertia::render('companies/dashboard/payments/index', [
            'payments' => $payments,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'status' => $status,
                'type' => $type,
                'sort' => $sort,
            ],
            'stats' => $stats,
        ]);
    }

    public function cancel(Company $company, Payment $payment)
    {
        $payment->update(['status' => PaymentStatus::CANCELLED]);

        return back();
    }
}
