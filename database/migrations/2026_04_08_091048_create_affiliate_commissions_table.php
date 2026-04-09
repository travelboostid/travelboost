<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('affiliate_commissions', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();
      $table->foreignId('company_id')->constrained()->cascadeOnDelete();

      $table->decimal('amount', 18, 2);
      $table->enum('tier', ['direct', 'master', 'partner']);
      $table->enum('status', ['pending', 'valid', 'invalid', 'paid'])->default('pending');

      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('affiliate_commissions');
  }
};
