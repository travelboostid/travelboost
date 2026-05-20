<?php

namespace App\Http\Controllers\Admin;

use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexPaymentRequest;
use App\Http\Requests\Admin\UpdateWithdrawalRequest;
use App\Models\Payment;
use App\Models\Withdrawal;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(IndexPaymentRequest $request)
    {
        $validated = $request->validated();

        $data = Payment::query()
            ->with(['payable', 'owner'])
            ->when($validated['status'] ?? null, function ($query, $status) {
                $statuses = explode(',', $status);
                $query->whereIn('status', $statuses);
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

        return Inertia::render('admin/funds/payments/index', [
            'data' => $data,
        ]);
    }

    public function update(UpdateWithdrawalRequest $request, Withdrawal $withdrawal)
    {
        $validated = $request->validated();
        DB::transaction(function () use ($withdrawal, $validated) {
            if (WithdrawalStatus::from($validated['status']) === WithdrawalStatus::PAID) {
                $wallet = $withdrawal->wallet;
                $wallet->withdraw($withdrawal->amount, [
                    'type' => 'wallet-withdrawal',
                    'description' => 'Withdrawal request approved',
                    'withdrawal_id' => $withdrawal->id,
                ]);
            }
            $withdrawal->update($validated);
        });

        return redirect()->back()->with('success', 'Withdrawal approved successfully.');
    }
}
