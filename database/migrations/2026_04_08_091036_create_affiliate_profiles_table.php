<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('affiliate_profiles', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();

      // Uplines
      $table->foreignId('upline_id')->nullable()->constrained('users')->nullOnDelete();

      $table->string('referral_code', 50)->unique();

      // Info bank
      $table->string('bank_name')->nullable();
      $table->string('bank_account_name')->nullable();
      $table->string('bank_account_number')->nullable();

      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('affiliate_profiles');
  }
};
