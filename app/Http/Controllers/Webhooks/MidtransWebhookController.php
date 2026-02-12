<?php

namespace App\Http\Controllers\Webhooks;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\User;
use Bavix\Wallet\Models\Wallet;
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
    if ($status === PaymentStatus::PAID && $payment->payable_type === 'wallet-topup') {
      $this->processWalletTopup($payment);
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

  protected function processWalletTopup(Payment $payment)
  {
    Log::info('Processing wallet topup for payment', ['payment_id' => $payment->id]);
    $user = User::where('id', $payment->user_id)->first();
    if (!$user) {
      Log::error('User not found for payment', ['payment_id' => $payment->id]);
      return;
    }
    $wallet = $user->wallet;

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

    $payable->update(['status' => 'completed']);

    Log::info('Topup successful', [
      'user_id' => $payment->user_id,
      'wallet_id' => $wallet->id,
      'amount' => $payment->amount,
    ]);
  }
}
