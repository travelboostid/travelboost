<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::table('companies', function (Blueprint $table) {
      $table->string('district')->nullable();
      $table->string('village')->nullable();
      $table->string('postal_code')->nullable();

      $table->string('identity_number', 16)->nullable();
      $table->string('identity_photo_path')->nullable();
    });
  }

  public function down(): void
  {
    Schema::table('companies', function (Blueprint $table) {
      $table->dropColumn([
        'district',
        'village',
        'postal_code',
        'identity_number',
        'identity_photo_path'
      ]);
    });
  }
};
