<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Wallet;
use App\Models\WalletTopupPayment;
use Bavix\Wallet\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Inertia\Inertia;

class WalletController extends Controller
{
    #[Authorize('view', 'company')]
    public function index(Request $request, Company $company)
    {
        abort_unless(
            $request->user()->isAbleTo('wallet.query', "company:{$company->id}"),
            403
        );

        $wallet = $this->resolveWallet($company, $request->query('wallet'));
        $balance = $wallet->balanceInt;

        $thisMonthStart = now()->startOfMonth();
        $thisMonthEnd = now()->endOfMonth();
        $lastMonthStart = now()->subMonth()->startOfMonth();
        $lastMonthEnd = now()->subMonth()->endOfMonth();

        $thisIncome = $wallet->walletTransactions()
            ->where('amount', '>', 0)
            ->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])
            ->sum('amount');

        $thisExpense = abs(
            $wallet->walletTransactions()
                ->where('amount', '<', 0)
                ->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])
                ->sum('amount')
        );

        $lastIncome = $wallet->walletTransactions()
            ->where('amount', '>', 0)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->sum('amount');

        $lastExpense = abs(
            $wallet->walletTransactions()
                ->where('amount', '<', 0)
                ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
                ->sum('amount')
        );

        $thisNet = $thisIncome - $thisExpense;
        $lastNet = $lastIncome - $lastExpense;

        $transactions = $wallet->walletTransactions()
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (Transaction $t) => [
                'id' => $t->id,
                'type' => $t->amount > 0 ? 'income' : 'expense',
                'amount' => $t->amount,
                'confirmed' => $t->confirmed,
                'meta' => $t->meta,
                'created_at' => $t->created_at,
            ]);

        $pendingTopup = Payment::query()
            ->whereMorphedTo('owner', $company)
            ->whereMorphedTo('payable', WalletTopupPayment::class)
            ->whereIn('status', [PaymentStatus::PENDING, PaymentStatus::UNPAID])
            ->whereIn(
                'payable_id',
                WalletTopupPayment::query()
                    ->select('id')
                    ->where('user_id', $request->user()->id)
            )
            ->latest()
            ->first();

        return Inertia::render('companies/dashboard/wallet/index', [
            'balance' => $balance,
            'income' => [
                'this_month' => $thisIncome,
                'last_month' => $lastIncome,
                'growth_pct' => $this->growthPercentage($thisIncome, $lastIncome),
            ],
            'expenses' => [
                'this_month' => $thisExpense,
                'last_month' => $lastExpense,
                'growth_pct' => $this->growthPercentage($thisExpense, $lastExpense),
            ],
            'net_change' => [
                'this_month' => $thisNet,
                'last_month' => $lastNet,
                'growth_pct' => $this->growthPercentage($thisNet, $lastNet),
            ],
            'transactions' => $transactions,
            'wallet' => [
                'id' => $wallet->id,
                'name' => $wallet->name,
                'slug' => $this->presentedWalletSlug($wallet),
                'description' => $wallet->description,
                'balance' => $wallet->balanceInt,
            ],
            'wallets' => $this->walletOptions($company),
            'pendingTopup' => $pendingTopup
                ? (new PaymentResource($pendingTopup))->resolve($request)
                : null,
        ]);
    }

    private function resolveWallet(Company $company, ?string $slug): Wallet
    {
        $defaultSlug = (string) config('wallet.wallet.default.slug', 'main');
        $slug = filled($slug) ? (string) $slug : $defaultSlug;

        if ($slug === 'main') {
            $slug = $defaultSlug;
        }

        /** @var Wallet|null $wallet */
        $wallet = $company->wallets()->where('slug', $slug)->first();

        abort_unless($wallet instanceof Wallet, 404);

        return $wallet;
    }

    /**
     * @return list<array{id: int, name: string, slug: string, description: string|null, balance: int|float|string, is_default: bool}>
     */
    private function walletOptions(Company $company): array
    {
        $defaultSlug = (string) config('wallet.wallet.default.slug', 'main');

        return $company->wallets()
            ->orderByRaw('CASE WHEN slug = ? THEN 0 ELSE 1 END', [$defaultSlug])
            ->orderBy('name')
            ->get()
            ->map(fn (Wallet $wallet) => [
                'id' => $wallet->id,
                'name' => $wallet->name,
                'slug' => $this->presentedWalletSlug($wallet),
                'description' => $wallet->description,
                'balance' => $wallet->balanceInt,
                'is_default' => $wallet->slug === $defaultSlug,
            ])
            ->values()
            ->all();
    }

    private function presentedWalletSlug(Wallet $wallet): string
    {
        $defaultSlug = (string) config('wallet.wallet.default.slug', 'main');

        return $wallet->slug === $defaultSlug ? 'main' : $wallet->slug;
    }

    private function growthPercentage(int $current, int $previous): float
    {
        if ($previous === 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / abs($previous)) * 100, 2);
    }
}
