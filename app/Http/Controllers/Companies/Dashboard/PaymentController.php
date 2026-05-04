<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Company;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
  // Display a listing of the payments for a specific company
  public function index(Company $company, Request $request)
  {
    // Determine the start date for filtering payments
    $from = $request->input('from')
      ? Carbon::parse($request->input('from'))->startOfDay()
      : now()->subMonth()->startOfDay(); // Default to one month ago

    // Determine the end date for filtering payments
    $to = $request->input('to')
      ? Carbon::parse($request->input('to'))->endOfDay()
      : now()->endOfDay(); // Default to now

    // Fetch payments within the specified date range
    $payments = $company->payments()->with('payable')
      ->whereBetween('created_at', [$from, $to]) // Filter by date range
      ->latest() // Order by latest payments
      ->get();

    // Render the payments index view with payments and filters
    return Inertia::render('companies/dashboard/payments/index', [
      'payments' => $payments,
      'filters' => [ // Return filters for consistency
        'from' => $request->input('from') ? $from->toDateString() : null,
        'to' => $request->input('to') ? $to->toDateString() : null,
      ],
    ]);
  }

  // Cancel a specific payment for a company
  public function cancel(Company $company, Payment $payment)
  {
    // Update the payment status to cancelled
    $payment->update(['status' => PaymentStatus::CANCELLED]);
    return back(); // Redirect back to the previous page
  }
}
