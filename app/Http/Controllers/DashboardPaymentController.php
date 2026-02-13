<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardPaymentController extends Controller
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

    $payments = Payment::with('payable')
      ->where('user_id', $user->id)
      ->whereBetween('created_at', [$from, $to]) // Simpler and more efficient
      ->latest()
      ->get();

    return Inertia::render('dashboard/payments/index', [
      'payments' => $payments,
      'filters' => [ // Return as filters object for consistency
        'from' => $request->input('from') ? $from->toDateString() : null,
        'to' => $request->input('to') ? $to->toDateString() : null,
      ],
    ]);
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
