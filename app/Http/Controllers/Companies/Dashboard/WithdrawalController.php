<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\IndexWithdrawalRequest;
use App\Models\Company;
use App\Models\Withdrawal;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexWithdrawalRequest $request, Company $company)
    {
        $validated = $request->validated(); // Get validated data from the request
        $wallets = $company->wallets()->get(); // Fetch all wallets associated with the company
        // Determine the start date for the withdrawal filter
        $from = $request->input('from')
          ? Carbon::parse($validated['from'])->startOfDay()
          : now()->subMonth()->startOfDay();

        // Determine the end date for the withdrawal filter
        $to = $request->input('to')
          ? Carbon::parse($validated['to'])->endOfDay()
          : now()->endOfDay();

        // Fetch withdrawals for the specified company within the date range
        $withdrawals = $company->withdrawals()->with(['wallet', 'bankAccount'])
            ->whereBetween('created_at', [$from, $to])
            ->when($validated['status'] ?? null, function ($query, $status) {
                $query->where('status', $status);
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
            ->latest()
            ->get();

        // Calculate statistics for the withdrawals
        $total_withdrawals = $withdrawals->count(); // Total number of withdrawals
        $total_amount = $withdrawals->sum('amount'); // Total amount withdrawn
        $pending_amount = $withdrawals->whereIn('status', ['requested', 'approved', 'processing'])->sum('amount'); // Total pending amount
        $completed_amount = $withdrawals->where('status', 'paid')->sum('amount'); // Total completed amount

        // Render the Inertia view with withdrawals and statistics
        return Inertia::render('companies/dashboard/withdrawals/index', [
            'wallets' => $wallets,
            'withdrawals' => $withdrawals,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'status' => $validated['status'] ?? null,
                'sort' => $validated['sort'] ?? null,
            ],
            'stats' => [
                'total_withdrawals' => $total_withdrawals,
                'total_amount' => $total_amount,
                'pending_amount' => $pending_amount,
                'completed_amount' => $completed_amount,
            ],
        ]);
    }

    public function store(Request $request, Company $company)
    {
        // Validate the incoming request data
        $validated = $request->validate([
            'wallet_id' => 'required|numeric|exists:wallets,id',
            'amount' => 'required|numeric|min:50000',
            'bank_account_id' => 'required|numeric|exists:bank_accounts,id',
        ]);

        // Check if the company has sufficient balance for the withdrawal
        if ($company->wallet->balance < $validated['amount']) {
            return back()->withErrors(['amount' => 'Insufficient balance for this withdrawal.']);
        }

        // Create a new withdrawal record
        $company->withdrawals()->create($validated);

        // Redirect back with a success message
        return back()->with('success', 'Withdrawal request submitted successfully.');
    }

    // Cancel a specific withdrawal
    public function cancel(Withdrawal $withdrawal)
    {
        $withdrawal->update([
            'status' => WithdrawalStatus::CANCELLED, // Update status to cancelled
        ]);

        return back(); // Redirect back
    }
}
