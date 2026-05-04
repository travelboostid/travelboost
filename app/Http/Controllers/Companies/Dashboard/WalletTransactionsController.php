<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Bavix\Wallet\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WalletTransactionsController extends Controller
{
  public function index(Request $request, Company $company)
  {
    $wallet = $company->wallet; // Retrieve the company's wallet

    // define date range for filtering transactions
    $from = $request->input('from')
      ? Carbon::parse($request->input('from'))->startOfDay() // Start date
      : now()->subMonth()->startOfDay(); // Default to one month ago

    $to = $request->input('to')
      ? Carbon::parse($request->input('to'))->endOfDay() // End date
      : now()->endOfDay(); // Default to today

    // Base query for transactions within the date range
    $query = $wallet->transactions()
      ->whereBetween('created_at', [$from, $to]); // Filter transactions by date range

    // Calculate statistics
    $transactionCount = (clone $query)->count(); // Count total transactions

    $incomeAmount = (clone $query)
      ->where('amount', '>', 0) // Filter for income transactions
      ->sum('amount'); // Sum income amounts

    $expenseAmount = abs(
      (clone $query)
        ->where('amount', '<', 0) // Filter for expense transactions
        ->sum('amount') // Sum expense amounts
    );

    // transactions list with pagination (latest 50 transactions)
    $transactions = (clone $query)
      ->latest() // Get latest transactions
      ->take(50) // Limit to 50 transactions
      ->get()
      ->map(fn(Transaction $t) => [
        'id' => $t->id,
        'type' => $t->amount > 0 ? 'income' : 'expense', // Determine transaction type
        'amount' => abs($t->amount), // Use absolute value for amount
        'meta' => $t->meta, // Transaction metadata
        'confirmed' => $t->confirmed, // Confirmation status
        'created_at' => $t->created_at, // Transaction creation date
      ]);

    return Inertia::render('companies/dashboard/wallet-transactions/index', [
      'from' => $from->toDateString(), // Format start date
      'to' => $to->toDateString(), // Format end date
      'transaction_count' => $transactionCount, // Total transaction count
      'income_amount' => $incomeAmount, // Total income amount
      'expense_amount' => $expenseAmount, // Total expense amount
      'transactions' => $transactions, // List of transactions
    ]);
  }
}
