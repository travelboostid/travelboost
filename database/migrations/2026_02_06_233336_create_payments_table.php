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
      $table->morphs('owner'); // creates owner_id + owner_type
      $table->morphs('payable'); // polymorphic: order, wallet_topup, etc
      $table->string('provider'); // midtrans, stripe, xendit, etc
      $table->string('payment_method')->nullable(); // snap, gopay, va, credit_card, etc
      $table->decimal('amount', 14, 2); // IDR, store as integer-like decimal
      $table->enum('status', PaymentStatus::cases())->default(PaymentStatus::UNPAID->value); // unpaid | pending | paid | failed | expired | refunded
      $table->json('payload')->nullable(); // Raw webhook / gateway payload
      $table->timestamp('paid_at')->nullable(); // When payment is successfully completed
      $table->timestamps();

      $table->index(['provider', 'status']);
    });

    Schema::create('wallet_topup_payments', function (Blueprint $table) {
      $table->id();
      $table->decimal('amount', 14, 2);
      $table->timestamps();
    });

    Schema::create('agent_subscription_payments', function (Blueprint $table) {
      $table->id();
      $table->foreignId('package_id')->constrained('agent_subscription_packages');
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('agent_subscription_payments');
    Schema::dropIfExists('wallet_topup_payments');
    Schema::dropIfExists('payments');
  }
};
