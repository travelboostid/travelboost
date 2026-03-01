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
      $table->foreignId('company_id')
        ->constrained('companies')
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
      $table->foreignId('company_id')
        ->constrained('companies')
        ->cascadeOnDelete();
      $table->foreignId('category_id')
        ->nullable()
        ->constrained('tour_categories')
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

      // UNIQUE per company
      $table->unique(['code', 'company_id']);
      $table->index('status');
    });

    Schema::create('tour_document_knowledge_bases', function (Blueprint $table) {
      $table->id();
      $table->foreignId('tour_id')
        ->constrained('tours')
        ->cascadeOnDelete();
      $table->text('content');
      $table->vector('embedding', dimensions: 1536);
      $table->timestamps();
    });

    Schema::create('agent_tours', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')
        ->constrained('companies')
        ->cascadeOnDelete();
      $table->foreignId('category_id')
        ->nullable()
        ->constrained('tour_categories')
        ->cascadeOnDelete();
      $table->foreignId('tour_id')
        ->constrained('tours')
        ->cascadeOnDelete();
      // created_at, updated_at
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('agent_tours');
    Schema::dropIfExists('knowledge_bases');
    Schema::dropIfExists('tour_categories');
    Schema::dropIfExists('tours');
  }
};
