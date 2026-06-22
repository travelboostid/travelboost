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
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Facades\DB;
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

        $thisIncome = (int) $wallet->walletTransactions()
            ->where('amount', '>', 0)
            ->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])
            ->sum('amount');

        $thisExpense = (int) abs(
            $wallet->walletTransactions()
                ->where('amount', '<', 0)
                ->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])
                ->sum('amount')
        );

        $lastIncome = (int) $wallet->walletTransactions()
            ->where('amount', '>', 0)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->sum('amount');

        $lastExpense = (int) abs(
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

    public function storeManualTopup(Request $request, Company $company)
    {
        $validated = $request->validate([
            'sender_bank_name' => ['required', 'string', 'max:255'],
            'sender_account_number' => ['required', 'string', 'max:255', 'regex:/^\d+$/'],
            'transfer_amount' => ['required', 'numeric', 'min:1'],
            'payment_date' => ['required', 'date', 'before_or_equal:today'],
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $existingPendingTopup = Payment::query()
            ->whereMorphedTo('owner', $company)
            ->whereMorphedTo('payable', WalletTopupPayment::class)
            ->whereIn('status', [PaymentStatus::PENDING, PaymentStatus::UNPAID])
            ->where('provider', 'manual')
            ->latest()
            ->first();

        if ($existingPendingTopup) {
            return back()->withErrors(['amount' => 'You already have a pending top-up request.']);
        }

        $proof = $request->file('proof');
        $path = $proof->store('payment-proofs', 'public');

        DB::transaction(function () use ($request, $company, $validated, $path) {
            $topupPayment = WalletTopupPayment::create([
                'user_id' => $request->user()->id,
                'amount' => $validated['transfer_amount'],
            ]);

            $topupPayment->payment()->create([
                'owner_type' => get_class($company),
                'owner_id' => $company->id,
                'provider' => 'manual',
                'payment_method' => 'bank_transfer',
                'amount' => $validated['transfer_amount'],
                'status' => 'pending',
                'payload' => [
                    'sender_bank' => $validated['sender_bank_name'],
                    'sender_account' => $validated['sender_account_number'],
                    'proof_path' => $path,
                    'payment_date' => Carbon::parse($validated['payment_date'])->toDateString(),
                ],
            ]);
        });

        return back()->with('success', 'Manual top-up request submitted.');
    }
}
