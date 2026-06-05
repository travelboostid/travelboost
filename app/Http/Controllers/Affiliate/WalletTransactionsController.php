<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Bavix\Wallet\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class WalletTransactionsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $wallet = $user->wallet;

        if (! $wallet) {
            $wallet = $user->wallet()->create([
                'name' => config('wallet.wallet.default.name'),
                'slug' => config('wallet.wallet.default.slug'),
                'description' => 'Primary wallet for user transactions',
            ]);
        }

        $from = $request->input('from') ? Carbon::parse($request->input('from'))->startOfDay() : now()->subMonth()->startOfDay();
        $to = $request->input('to') ? Carbon::parse($request->input('to'))->endOfDay() : now()->endOfDay();

        $query = $wallet->transactions()->whereBetween('created_at', [$from, $to]);

        return Inertia::render('affiliate/dashboard/fund/transactions/index', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'transaction_count' => (clone $query)->count(),
            'income_amount' => (float) (clone $query)->where('amount', '>', 0)->sum('amount'),
            'expense_amount' => abs((float) (clone $query)->where('amount', '<', 0)->sum('amount')),
            'transactions' => (clone $query)
                ->latest()
                ->take(50)
                ->get()
                ->map(fn (Transaction $transaction): array => [
                    'id' => $transaction->id,
                    'type' => $transaction->amount > 0 ? 'income' : 'expense',
                    'amount' => abs((float) $transaction->amount),
                    'meta' => $transaction->meta,
                    'confirmed' => $transaction->confirmed,
                    'created_at' => $transaction->created_at,
                ]),
        ]);
    }
}
