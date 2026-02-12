<?php

use App\Enums\WithdrawalStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('withdrawals', function (Blueprint $table) {
      $table->id();

      /**
       * Owner of the wallet
       */
      $table->foreignId('user_id')
        ->constrained()
        ->cascadeOnDelete();

      /**
       * Destination payout account
       */
      $table->foreignId('bank_account_id')
        ->constrained()
        ->restrictOnDelete();

      /**
       * Bavix wallet reference (optional)
       * Allows multi-wallet in the future
       */
      $table->integer('wallet_id')->nullable();

      /**
       * Amount in smallest unit (IDR)
       */
      $table->decimal('amount', 18, 2);

      /**
       * Withdrawal lifecycle
       *
       * requested   → user submits
       * approved    → admin approves
       * processing  → wallet debited
       * paid        → payout success
       * rejected    → admin rejects
       * failed      → payout failed (refund needed)
       */
      $table->enum('status', WithdrawalStatus::cases())->default(WithdrawalStatus::REQUESTED);

      /**
       * Internal / admin note
       */
      $table->text('note')->nullable();

      /**
       * Audit timestamps
       */
      $table->timestamp('approved_at')->nullable();
      $table->timestamp('processed_at')->nullable();
      $table->timestamp('paid_at')->nullable();

      $table->timestamps();

      /**
       * Indexes for performance
       */
      $table->index(['user_id', 'status']);
      $table->index(['bank_account_id']);
      $table->index(['wallet_id']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('withdrawals');
  }
};
