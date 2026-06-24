<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Wallet;
use App\Models\WalletTopupPayment;
use Bavix\Wallet\Models\Transaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class WalletTransactionsController extends Controller
{
    #[Authorize('view', 'company')]
    public function index(Request $request, Company $company)
    {
        abort_unless(
            $request->user()->isAbleTo('wallet-transaction.query', "company:{$company->id}"),
            403
        );

        $wallet = $this->resolveWallet($company, $request->query('wallet'));

        $from = $request->filled('from')
            ? Carbon::parse($request->input('from'))->startOfDay()
            : now()->subMonth()->startOfDay();

        $to = $request->filled('to')
            ? Carbon::parse($request->input('to'))->endOfDay()
            : now()->endOfDay();

        $type = $request->input('type', 'all');
        if (! in_array($type, ['all', 'income', 'expense'], true)) {
            $type = 'all';
        }

        $periodQuery = $wallet->walletTransactions()
            ->whereBetween('created_at', [$from, $to]);

        $transactionCount = (clone $periodQuery)->count();

        $incomeAmount = (int) (clone $periodQuery)
            ->where('amount', '>', 0)
            ->sum('amount');

        $expenseAmount = (int) abs(
            (clone $periodQuery)
                ->where('amount', '<', 0)
                ->sum('amount')
        );

        $listQuery = (clone $periodQuery)
            ->when($type === 'income', fn (Builder $query) => $query->where('amount', '>', 0))
            ->when($type === 'expense', fn (Builder $query) => $query->where('amount', '<', 0));

        $transactions = $listQuery
            ->latest()
            ->take(50)
            ->get()
            ->map(fn (Transaction $t) => [
                'id' => $t->id,
                'type' => $t->amount > 0 ? 'income' : 'expense',
                'amount' => abs($t->amount),
                'meta' => $t->meta,
                'confirmed' => $t->confirmed,
                'status' => 'success',
                'created_at' => $t->created_at,
            ]);

        $pendingOrRejectedTopups = Payment::query()
            ->whereMorphedTo('owner', $company)
            ->whereMorphedTo('payable', WalletTopupPayment::class)
            ->where('provider', 'manual')
            ->whereIn('status', ['pending', 'failed', 'cancelled'])
            ->whereBetween('created_at', [$from, $to])
            ->when($type === 'expense', fn (Builder $query) => $query->where('id', '<', 0))
            ->latest()
            ->take(50)
            ->get()
            ->map(fn (Payment $p) => [
                'id' => 'p_'.$p->id,
                'type' => 'income',
                'amount' => (int) $p->amount,
                'meta' => [
                    'description' => 'Manual Top-up',
                ],
                'confirmed' => false,
                'status' => $p->status->value,
                'created_at' => $p->created_at,
            ]);

        $allTransactions = collect($transactions)->concat($pendingOrRejectedTopups)
            ->sortByDesc('created_at')
            ->values()
            ->take(50)
            ->all();

        return Inertia::render('companies/dashboard/wallet-transactions/index', [
            'filters' => [
                'wallet' => $this->presentedWalletSlug($wallet),
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'type' => $type,
            ],
            'wallet' => [
                'id' => $wallet->id,
                'name' => $wallet->name,
                'slug' => $this->presentedWalletSlug($wallet),
                'description' => $wallet->description,
                'balance' => $wallet->balanceInt,
            ],
            'wallets' => $this->walletOptions($company),
            'transaction_count' => $transactionCount,
            'income_amount' => $incomeAmount,
            'expense_amount' => $expenseAmount,
            'transactions' => $allTransactions,
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
}
