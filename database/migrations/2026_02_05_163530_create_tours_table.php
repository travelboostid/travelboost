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
    Schema::create('tour_categories', function (Blueprint $table) {
      $table->id();
      $table->string('name')->unique();
      $table->text('description')->nullable();
      $table->foreignId('user_id')
        ->constrained('users')
        ->cascadeOnDelete();
      $table->timestamps();
    });

    Schema::create('tours', function (Blueprint $table) {
      $table->id();

      $table->string('code');
      $table->string('name');
      $table->text('description')->nullable();

      $table->unsignedInteger('duration_days');

      $table->string('status')->default('active');

      $table->string('continent');
      $table->string('region');
      $table->string('country');
      $table->string('destination');

      $table->foreignId('user_id')
        ->constrained('users')
        ->cascadeOnDelete();
      $table->foreignId('category_id')
        ->nullable()
        ->constrained('tour_categories')
        ->cascadeOnDelete();
      $table->foreignId('parent_id')
        ->nullable()
        ->constrained('tours')
        ->cascadeOnDelete();
      $table->foreignId('image_id')
        ->nullable()
        ->constrained('medias')
        ->nullOnDelete();
      $table->foreignId(column: 'document_id')
        ->nullable()
        ->constrained('medias')
        ->nullOnDelete();
      $table->timestamps();

      // UNIQUE per user
      $table->unique(['code', 'user_id']);
      // Helpful indexes
      $table->index('status');
      $table->index(['continent', 'region', 'country']);
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('tour_categories');
    Schema::dropIfExists('tours');
  }
};
