<?php

namespace App\Http\Controllers\Affiliate;

use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $from = $request->input('from') ? Carbon::parse($request->input('from'))->startOfDay() : now()->subMonth()->startOfDay();
        $to = $request->input('to') ? Carbon::parse($request->input('to'))->endOfDay() : now()->endOfDay();

        // ====================================================================
        // [DEPLOYMENT] UNCOMMENT BLOK INI
        // ====================================================================
        /*
            $withdrawals = Withdrawal::with('bankAccount')
                ->where('owner_type', get_class($user)) // Menggunakan relasi Polimorfik persis seperti tim backend
                ->where('owner_id', $user->id)
                ->whereBetween('created_at', [$from, $to])
                ->latest()
                ->get();

            $stats = [
                'total_withdrawals' => $withdrawals->count(),
                'total_amount'      => $withdrawals->sum('amount'),
                'pending_amount'    => $withdrawals->whereIn('status', [Withdrawal::STATUS_REQUESTED, Withdrawal::STATUS_PROCESSING])->sum('amount'),
                'completed_amount'  => $withdrawals->where('status', Withdrawal::STATUS_PAID)->sum('amount'),
            ];
            */

        // [DUMMY]
        $withdrawals = collect([]);
        $stats = ['total_withdrawals' => 0, 'total_amount' => 0, 'pending_amount' => 0, 'completed_amount' => 0];

        return Inertia::render('affiliate/dashboard/fund/withdrawals/index', [
            'withdrawals' => $withdrawals,
            'stats' => $stats,
            'filters' => ['from' => $request->input('from') ? $from->toDateString() : null, 'to' => $request->input('to') ? $to->toDateString() : null],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'amount' => 'required|numeric|min:50000',
            'bank_account_id' => 'required|exists:bank_accounts,id',
        ]);

        if ($user->balance < $validated['amount']) {
            return back()->withErrors(['amount' => 'Insufficient balance.']);
        }

        // Simpan menggunakan struktur Polymorphic
        Withdrawal::create([
            'owner_type' => get_class($user),
            'owner_id' => $user->id,
            'bank_account_id' => $validated['bank_account_id'],
            'amount' => $validated['amount'],
            'status' => WithdrawalStatus::PENDING,
        ]);

        return back()->with('success', 'Withdrawal request submitted.');
    }
}
