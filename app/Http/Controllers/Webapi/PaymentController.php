<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentIndexRequest;
use App\Http\Resources\PaymentResource;
use App\Models\AgentSubscriptionPackage;
use App\Models\AgentSubscriptionPayment;
use App\Models\AiCreditTopupPayment;
use App\Models\Payment;
use App\Models\WalletTopupPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
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
      ->when(
        $request->filled('owner_type'),
        fn($q) => $q->where('owner_type', $request->owner_type)
      )
      ->when(
        $request->filled('owner_id'),
        fn($q) => $q->where('owner_id', $request->owner_id)
      )
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
  public function createTopupPayment(Request $request)
  {
    $validated = $request->validate([
      'owner_type' => ['required', 'in:user,company'],
      'owner_id' => [
        'required',
        Rule::when(
          $request->owner_type === 'user',
          Rule::exists('users', 'id'),
          Rule::exists('companies', 'id')
        ),
      ],
      'amount' => ['required', 'integer', 'min:100000'],
    ]);

    $user = Auth::user();

    $topup = WalletTopupPayment::create([
      'amount' => $validated['amount'],
    ]);

    // ... rest of your code remains the same
    $payment = $topup->payment()->create([
      'owner_type' => $validated['owner_type'],
      'owner_id' => $validated['owner_id'],
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

  /**
   * Create payment for agent subscription
   * 
   * @operationId createAgentSubscriptionPayment
   */
  public function createAgentSubscriptionPayment(Request $request)
  {
    $validated = $request->validate([
      'company_id' => ['required', 'exists:companies,id'],
      'package_id' => ['required', 'exists:agent_subscription_packages,id'],
    ]);
    $user = Auth::user();

    $package = AgentSubscriptionPackage::findOrFail($validated['package_id']);
    $subscriptionPayment = AgentSubscriptionPayment::create([
      'package_id' => $validated['package_id'],
    ]);
    $amount = $package->price;

    // ... rest of your code remains the same
    $payment = $subscriptionPayment->payment()->create([
      'owner_id' => $validated['company_id'],
      'owner_type' => 'company',
      'provider' => 'midtrans',
      'payment_method' => 'snap',
      'amount' => $amount,
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

  /**
   * Create payment for AI credit topup
   * 
   * @operationId createAiCreditTopupPayment
   */

  public function createAiCreditTopupPayment(Request $request)
  {
    $validated = $request->validate([
      'company_id' => ['required', 'exists:companies,id'],
      'amount' => ['required', 'integer', 'min:1'],
    ]);
    $user = Auth::user();

    $amount = $validated['credits'] * 1000; // Assuming 1 credit = 1000 currency unit
    $topup = AiCreditTopupPayment::create([
      'amount' => $validated['amount'],
    ]);

    // Create a payment record
    $payment = $topup->payment()->create([
      'owner_id' => $validated['company_id'],
      'owner_type' => 'company',
      'provider' => 'midtrans',
      'payment_method' => 'snap',
      'amount' => $amount,
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
