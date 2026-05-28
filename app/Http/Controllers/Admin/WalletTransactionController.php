<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexWalletTransactionRequest;
use App\Models\Company;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

#[Authorize('access-admin')]
class WalletTransactionController extends Controller
{
    public function index(IndexWalletTransactionRequest $request)
    {
        $validated = $request->validated();
        $holderTypes = [
            'user' => User::class,
            'company' => Company::class,
        ];
        $data = Transaction::query()
            ->with(['wallet', 'payable', 'wallet.holder'])
            ->when($validated['wallet_holder'] ?? null, function ($query, $holder) use ($holderTypes) {
                [$type, $id] = explode(':', $holder);
                $model = $holderTypes[$type];
                $query->whereWalletHolder($model, $id);
            })
            ->when($validated['created_at'] ?? null, function ($query, $created_at) {
                $range = explode(',', $created_at);

                if (count($range) === 2) {
                    $from = Carbon::createFromTimestamp($range[0] / 1000);
                    $to = Carbon::createFromTimestamp($range[1] / 1000);
                    $query->whereBetween('created_at', [$from, $to]);
                } else {
                    $date = Carbon::createFromTimestamp($range[0] / 1000);
                    $query->whereDate('created_at', $date);
                }
            })
            ->when($validated['sort'] ?? null, function ($query, $sort) {
                $sorts = explode(',', $sort);
                foreach ($sorts as $item) {
                    $dir = str_starts_with($item, '-') ? 'desc' : 'asc';
                    $field = ltrim($item, '-');
                    $query->orderBy($field, $dir);
                }
            })
            ->paginate($validated['per_page'] ?? 10);

        return Inertia::render('admin/funds/wallet-transactions/index', [
            'data' => $data,
        ]);
    }
}
