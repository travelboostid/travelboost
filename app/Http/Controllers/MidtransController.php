<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Midtrans\Notification;

class MidtransController extends Controller
{
  public function notification(Request $request)
  {
    Log::info('Midtrans notification received', $request->all());

    try {
      $notification = new Notification();

      $gatewayOrderId = $notification->order_id;
      $transactionStatus = $notification->transaction_status;
      $fraudStatus = $notification->fraud_status ?? null;
      $paymentMethod = $notification->payment_type ?? null;

      // 🔎 Find payment by gateway reference
      $payment = Payment::where('gateway_order_id', $gatewayOrderId)->first();

      if (! $payment) {
        Log::warning('Payment not found', [
          'gateway_order_id' => $gatewayOrderId,
        ]);

        return response()->json(['status' => 'payment_not_found']);
      }

      // Map Midtrans → internal
      $newStatus = $this->mapStatus($transactionStatus, $fraudStatus);

      // Idempotency: nothing to do
      if ($payment->status === $newStatus) {
        return response()->json(['status' => 'no_state_change']);
      }

      // Update payment
      $payment->update([
        'status' => $newStatus,
        'payment_method' => $paymentMethod,
        'payload' => $request->all(),
        'paid_at' => $newStatus === 'paid' ? now() : $payment->paid_at,
      ]);

      // 🔥 Only trigger domain logic ONCE
      if ($newStatus === 'paid') {
        $payment->payable->onPaid($payment);
      }

      return response()->json(['status' => 'ok']);
    } catch (\Throwable $e) {
      Log::error('Midtrans notification error', [
        'message' => $e->getMessage(),
      ]);

      // Always 200 so Midtrans doesn't retry forever
      return response()->json(['status' => 'error_handled']);
    }
  }

  private function mapStatus(string $transactionStatus, ?string $fraudStatus): string
  {
    return match ($transactionStatus) {
      'capture' => $fraudStatus === 'challenge'
        ? 'pending'
        : 'paid',

      'settlement' => 'paid',
      'pending' => 'pending',
      'deny', 'cancel' => 'failed',
      'expire' => 'expired',
      'refund', 'partial_refund' => 'refunded',

      default => 'failed',
    };
  }
}
