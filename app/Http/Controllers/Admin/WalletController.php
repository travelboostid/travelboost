<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexWalletRequest;
use App\Models\Wallet;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class WalletController extends Controller
{
    public function index(IndexWalletRequest $request)
    {
        $validated = $request->validated();

        $data = Wallet::query()
            ->with(['holder'])
            ->when($validated['holder'] ?? null, function ($query, $owners) {
                $owners = collect($owners)
                    ->map(function ($owner) {
                        [$type, $id] = explode(':', $owner, 2);

                        return [$type, (int) $id];
                    })
                    ->all();

                $query->whereHolderIn($owners);
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

        return Inertia::render('admin/funds/wallets/index', [
            'data' => $data,
        ]);
    }
}
