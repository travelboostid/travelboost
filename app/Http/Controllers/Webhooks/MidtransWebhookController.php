<?php

namespace App\Http\Controllers\Webhooks;

use App\Enums\AgentSubscriptionStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MidtransWebhookController extends Controller
{
  public function handleNotification(Request $request)
  {
    $payload = $request->all();
    Log::debug('Midtrans webhook received:', $payload);

    // Get transaction details from Midtrans
    $transactionId = $payload['order_id'] ?? null;

    if (!$transactionId) {
      return response()->json(['error' => 'No order ID'], 400);
    }
    $paymentId = Str::before($transactionId, '-');

    // Find payment by transaction ID from payload
    $payment = Payment::where('id', $paymentId)->first();

    if (!$payment) {
      return response()->json(['error' => 'Payment not found'], 404);
    }

    Log::debug('Processing payment', ['payment' => $payment]);

    // Check if payment is already processed
    if ($payment->status === 'paid') {
      return response()->json(['message' => 'Payment already processed']);
    }

    // Update payment status based on Midtrans status
    $status = $this->mapStatus($payload['transaction_status'] ?? 'pending');

    // Handle wallet topup if payment is paid
    if ($status === PaymentStatus::PAID) {
      $this->processPayment($payment);
    } else {
      return response()->json(['error' => 'Payment is not eligible to be processed'], 404);
    }

    $payment->update([
      'status' => $status,
      'payload' => array_merge($payment->payload ?? [], $payload),
      'paid_at' => $status === PaymentStatus::PAID ? now() : null,
    ]);


    return response()->json(['message' => 'Webhook processed']);
  }

  protected function mapStatus($midtransStatus)
  {
    return match ($midtransStatus) {
      'capture', 'settlement' => PaymentStatus::PAID,
      'pending' => PaymentStatus::PENDING,
      'deny', 'cancel', 'expire' => PaymentStatus::FAILED,
      default => PaymentStatus::PENDING,
    };
  }

  private function processPayment(Payment $payment)
  {
    if ($payment->payable_type === 'agent-subscription-payment') {
      $this->processAgentSubscription($payment);
    } else if ($payment->payable_type === 'wallet-topup-payment') {
      $this->processWalletTopup($payment);
    } else {
      Log::warning('Unknown payable type for payment processing', [
        'payment_id' => $payment->id,
        'payable_type' => $payment->payable_type,
      ]);
    }
  }

  private function processAgentSubscription(Payment $payment)
  {
    Log::info('Processing agent subscription for payment', ['payment_id' => $payment->id]);
    /** @var Company */
    $owner = $payment->owner;

    if (!$owner) {
      Log::error('Owner not found for payment', ['payment_id' => $payment->id]);
      return;
    }
    $payment->load('payable');
    if (!$payable = $payment->payable) {
      Log::error('Payable not found', ['payment_id' => $payment->id]);
      return;
    }
    $package = $payable->package_id ? AgentSubscriptionPackage::find($payable->package_id) : null;
    if (!$package) {
      Log::error('Package not found for agent subscription payment', ['payment_id' => $payment->id]);
      return;
    }
    $existingSubscription = $owner->agentSubscription()->first();
    if ($existingSubscription === null) {
      $owner->agentSubscription()->create([
        'package_id' => $package->id,
        'started_at' => now(),
        'ended_at' => now()->addMonths($package->duration_months),
      ]);
      return;
    } else if ($existingSubscription->status === AgentSubscriptionStatus::ACTIVE) {
      $existingSubscription->update([
        'package_id' => $package->id,
        'started_at' => now(),
        'ended_at' => $existingSubscription->ended_at->addMonths($package->duration_months),
      ]);
      return;
    } else if ($existingSubscription->status === AgentSubscriptionStatus::EXPIRED) {
      $existingSubscription->update([
        'package_id' => $package->id,
        'started_at' => now(),
        'ended_at' => now()->addMonths($package->duration_months),
      ]);
      return;
    }
  }

  private function processWalletTopup(Payment $payment)
  {
    Log::info('Processing wallet topup for payment', ['payment_id' => $payment->id]);
    $owner = $payment->owner;
    if (!$owner) {
      Log::error('Owner not found for payment', ['payment_id' => $payment->id]);
      return;
    }
    $wallet = $owner->wallet;

    $payment->load('payable');

    if (!$payable = $payment->payable) {
      Log::error('Payable not found', ['payment_id' => $payment->id]);
      return;
    }

    $wallet->deposit($payment->amount, [
      'type' => 'topup',
      'description' => 'Wallet topup via Midtrans',
      'payment_id' => $payment->id,
    ]);

    Log::info('Topup successful', [
      'owner_id' => $payment->owner_id,
      'wallet_id' => $wallet->id,
      'amount' => $payment->amount,
    ]);
  }
}
