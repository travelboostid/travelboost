<?php

use App\Enums\PaymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('payments', function (Blueprint $table) {
      $table->id();

      $table->foreignId('user_id')
        ->constrained()
        ->cascadeOnDelete();

      // polymorphic: order, wallet_topup, etc
      $table->morphs('payable');

      // midtrans, stripe, xendit, etc
      $table->string('provider');

      // snap, gopay, va, credit_card, etc
      $table->string('payment_method')->nullable();

      // IDR, store as integer-like decimal
      $table->decimal('amount', 14, 2);

      // unpaid | pending | paid | failed | expired | refunded
      $table->enum('status', PaymentStatus::cases())->default(PaymentStatus::UNPAID->value);

      // Raw webhook / gateway payload
      $table->json('payload')->nullable();

      // When payment is successfully completed
      $table->timestamp('paid_at')->nullable();

      $table->timestamps();

      // helpful indexes
      $table->index(['provider', 'status']);
    });

    Schema::create('wallet_topups', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();
      $table->decimal('amount', 14, 2);
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('payments');
  }
};
