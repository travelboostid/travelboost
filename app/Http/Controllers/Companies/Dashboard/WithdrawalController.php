<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Withdrawal;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index(Request $request, Company $company)
  {
    // Determine the start date for the withdrawal filter
    $from = $request->input('from')
      ? Carbon::parse($request->input('from'))->startOfDay()
      : now()->subMonth()->startOfDay();

    // Determine the end date for the withdrawal filter
    $to = $request->input('to')
      ? Carbon::parse($request->input('to'))->endOfDay()
      : now()->endOfDay();

    // Fetch withdrawals for the specified company within the date range
    $withdrawals = Withdrawal::with('bankAccount')
      ->where('owner_type', Company::class)
      ->where('owner_id', $company->id)
      ->whereBetween('created_at', [$from, $to])
      ->latest()
      ->get();

    // Calculate statistics for the withdrawals
    $total_withdrawals = $withdrawals->count(); // Total number of withdrawals
    $total_amount = $withdrawals->sum('amount'); // Total amount withdrawn
    $pending_amount = $withdrawals->whereIn('status', ['requested', 'approved', 'processing'])->sum('amount'); // Total pending amount
    $completed_amount = $withdrawals->where('status', 'paid')->sum('amount'); // Total completed amount

    // Render the Inertia view with withdrawals and statistics
    return Inertia::render('companies/dashboard/withdrawals/index', [
      'withdrawals' => $withdrawals,
      'filters' => [
        'from' => $request->input('from') ? $from->toDateString() : null,
        'to' => $request->input('to') ? $to->toDateString() : null,
      ],
      'stats' => [
        'total_withdrawals' => $total_withdrawals,
        'total_amount' => $total_amount,
        'pending_amount' => $pending_amount,
        'completed_amount' => $completed_amount,
      ],
    ]);
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
