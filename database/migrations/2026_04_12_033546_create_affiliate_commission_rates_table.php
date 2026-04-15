<?php

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
    Schema::create('affiliate_commission_rates', function (Blueprint $table) {
      $table->id();
      $table->enum('tier', ['partner', 'master_affiliate', 'affiliate']);
      $table->decimal('percentage', 5, 2); // Contoh: 15.00
      $table->boolean('is_active')->default(true);
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('affiliate_commission_rates');
  }
};
