<?php

namespace App\Http\Controllers;

use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardWithdrawalController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index()
  {
    $user = Auth::user();
    $withdrawals = Withdrawal::where('user_id', $user->id)->latest()->get();
    return Inertia::render('dashboard/withdrawals/index', [
      'withdrawals' => $withdrawals,
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
