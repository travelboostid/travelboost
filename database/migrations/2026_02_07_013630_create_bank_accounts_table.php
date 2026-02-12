<?php

use App\Enums\BankAccountStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::create('bank_accounts', function (Blueprint $table) {
      $table->id();

      $table->foreignId('user_id')
        ->constrained()
        ->cascadeOnDelete();

      // bank / e-wallet provider code
      $table->string('provider'); // BCA, BNI, MANDIRI, OVO, GOPAY

      $table->string('account_number');
      $table->string('account_name');

      // optional
      $table->string('branch')->nullable();

      // pending | verified | rejected
      $table->enum('status', BankAccountStatus::cases())->default(BankAccountStatus::PENDING);

      // mark default destination
      $table->boolean('is_default')->default(false);

      $table->timestamps();

      $table->index(['user_id', 'provider']);
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('bank_accounts');
  }
};
