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
    Schema::create('affiliate_profiles', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
      // Upline adalah User ID milik atasan (Partner/MA)
      $table->foreignId('upline_id')->nullable()->constrained('users')->onDelete('set null');

      $table->enum('tier', ['partner', 'master_affiliate', 'affiliate']);
      $table->enum('status', ['pending', 'approved', 'rejected', 'suspended'])->default('pending');

      $table->string('referral_code')->unique();
      $table->timestamp('approved_at')->nullable();
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('affiliate_profiles');
  }
};
