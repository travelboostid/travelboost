<?php

namespace App\Http\Controllers;

use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardWithdrawalController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index(Request $request)
  {
    $user = Auth::user();

    /**
     * ------------------------------------------------------
     * Date range (optional)
     * default = last 1 month
     * ------------------------------------------------------
     */
    $from = $request->input('from')
      ? Carbon::parse($request->input('from'))->startOfDay()
      : now()->subMonth()->startOfDay();

    $to = $request->input('to')
      ? Carbon::parse($request->input('to'))->endOfDay()
      : now()->endOfDay();

    $withdrawals = Withdrawal::with('bankAccount')
      ->where('user_id', $user->id)
      ->whereBetween('created_at', [$from, $to])
      ->latest()
      ->get();

    // Calculate statistics
    $total_withdrawals = $withdrawals->count();
    $total_amount = $withdrawals->sum('amount');
    $pending_amount = $withdrawals->whereIn('status', ['requested', 'approved', 'processing'])->sum('amount');
    $completed_amount = $withdrawals->where('status', 'paid')->sum('amount');

    return Inertia::render('dashboard/withdrawals/index', [
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

  public function cancel(Withdrawal $withdrawal)
  {
    $withdrawal->update([
      'status' => WithdrawalStatus::CANCELLED,
    ]);
    return back();
  }

  /**
   * Show the form for creating a new resource.
   */
  public function create()
  {
    //
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request)
  {
    //
  }

  /**
   * Display the specified resource.
   */
  public function show(string $id)
  {
    //
  }

  /**
   * Show the form for editing the specified resource.
   */
  public function edit(string $id)
  {
    //
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, string $id)
  {
    //
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(string $id)
  {
    //
  }
}
