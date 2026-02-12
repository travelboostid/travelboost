<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentIndexRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\WalletTopup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Midtrans\Snap;

class PaymentController extends Controller
{
  /**
   * get payment list
   *
   * @operationId getPayments
   */
  public function index(PaymentIndexRequest $request)
  {
    $payments = Payment::query()
      ->where('user_id', Auth::id())

      ->when(
        $request->filled('payable_type'),
        fn($q) => $q->where('payable_type', $request->payable_type)
      )

      ->when(
        $request->filled('status'),
        fn($q) => $q->where('status', $request->status)
      )

      ->when(
        $request->filled('provider'),
        fn($q) => $q->where('provider', $request->provider)
      )

      ->when(
        $request->filled('from'),
        fn($q) => $q->whereDate('created_at', '>=', $request->from)
      )

      ->when(
        $request->filled('to'),
        fn($q) => $q->whereDate('created_at', '<=', $request->to)
      )

      ->latest()
      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    return PaymentResource::collection($payments);
  }

  /**
   * Create wallet topup payment (Midtrans Snap)
   *
   * @operationId createTopupPayment
   */
  public function topup(Request $request)
  {
    $validated = $request->validate([
      'amount' => ['required', 'integer', 'min:100000'],
    ]);

    $user = Auth::user();

    $topup = WalletTopup::create([
      'user_id' => $user->id,
      'amount' => $validated['amount'],
    ]);

    // ... rest of your code remains the same
    $payment = $topup->payment()->create([
      'user_id' => $user->id,
      'provider' => 'midtrans',
      'payment_method' => 'snap',
      'amount' => $topup->amount,
      'status' => 'unpaid',
    ]);

    $params = [
      'transaction_details' => [
        'order_id' => $payment->id . '-' . uniqid(),
        'gross_amount' => (int) $payment->amount,
      ],
      'customer_details' => [
        'first_name' => $user->name,
        'email' => $user->email,
      ],
      'callbacks' => [
        'finish' => config('app.url') . '/wallet',
      ],
    ];

    $snapToken = Snap::getSnapToken($params);

    $payment->update([
      'status' => 'pending',
      'payload' => [
        'snap_token' => $snapToken,
        'request' => $params,
      ],
    ]);

    return new PaymentResource($payment);
  }
}
