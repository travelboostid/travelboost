<?php

namespace App\Http\Controllers\Admin;

use App\Enums\WithdrawalMethod;
use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexWithdrawalRequest;
use App\Http\Requests\Admin\UpdateWithdrawalRequest;
use App\Jobs\ProcessAutoWithdrawalJob;
use App\Models\Withdrawal;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

#[Authorize('access-admin-pages')]
class WithdrawalController extends Controller
{
    public function index(IndexWithdrawalRequest $request)
    {
        $validated = $request->validated();

        $data = Withdrawal::query()
            ->with(['wallet', 'bankAccount', 'owner'])
            ->when($validated['method'] ?? null, function ($query, $method) {
                $query->whereIn('method', $method);
            })
            ->when($validated['status'] ?? null, function ($query, $status) {
                $query->whereIn('status', $status);
            })
            ->when($validated['owner'] ?? null, function ($query, $owners) {
                $owners = collect($owners)
                    ->map(function ($owner) {
                        [$type, $id] = explode(':', $owner, 2);

                        return [$type, (int) $id];
                    })
                    ->all();

                $query->whereOwnerIn($owners);
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

        return Inertia::render('admin/funds/withdrawals/index', [
            'data' => $data,
        ]);
    }

    public function update(UpdateWithdrawalRequest $request, Withdrawal $withdrawal)
    {
        $validated = $request->validated();
        if ($validated['status'] === WithdrawalStatus::PROCESSING->value) {
            $validated['processing_at'] = now();
        } elseif ($validated['status'] === WithdrawalStatus::REJECTED->value) {
            $validated['rejected_at'] = now();
        } elseif ($validated['status'] === WithdrawalStatus::PAID->value) {
            $validated['paid_at'] = now();
        }
        $withdrawal->update($validated);
        $withdrawal->refresh();

        if (
            $withdrawal->method === WithdrawalMethod::AUTO
            && $withdrawal->status === WithdrawalStatus::PROCESSING
        ) {
            ProcessAutoWithdrawalJob::dispatch($withdrawal);
        }
        if ($withdrawal->method === WithdrawalMethod::MANUAL && $withdrawal->status === WithdrawalStatus::PAID) {
            $wallet = $withdrawal->loadMissing('wallet')->wallet;
            $wallet->withdraw($withdrawal->amount, [
                'type' => 'wallet-withdrawal',
                'description' => 'Withdrawal request approved',
                'withdrawal_id' => $withdrawal->id,
            ]);
        }

        return redirect()->back()->with('success', 'Withdrawal approved successfully.');
    }
}
