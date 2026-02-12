<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
  /** Display a listing of the resource.
   */
  public function index()
  {
    $user = Auth::user();
    $balance = $user->balance;
    $transactions = $user->transactions()->latest()->take(10)->get();
    return Inertia::render('dashboard/index', [
      'balance' => $balance,
      'recentTransactions' => $transactions
    ]);
  }
}
