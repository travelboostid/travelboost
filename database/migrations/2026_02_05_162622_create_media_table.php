<?php

use App\Enums\MediaType;
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
    Schema::create('medias', function (Blueprint $table) {
      $table->id();
      $table->string('name', 255);
      $table->string('description', 1000)->nullable();
      $table->enum('type', MediaType::cases()); // Enum will be stored as string
      $table->json('data')->nullable();
      $table->foreignId('user_id')
        ->constrained()
        ->cascadeOnDelete();
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('media');
  }
};
