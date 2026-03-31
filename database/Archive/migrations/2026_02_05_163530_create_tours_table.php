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
    Schema::create('continents', function (Blueprint $table) {
      $table->id();
      $table->timestamps();
      $table->string('name');
    });

    Schema::create('regions', function (Blueprint $table) {
      $table->id();
      $table->timestamps();
      $table->string('name');
      $table->foreignId('continent_id')
        ->constrained('continents')
        ->cascadeOnDelete();
    });

    Schema::create('countries', function (Blueprint $table) {
      $table->id();
      $table->timestamps();
      $table->string('name');
      $table->foreignId('continent_id')
        ->constrained('continents')
        ->cascadeOnDelete();
      $table->foreignId('region_id')
        ->constrained('regions')
        ->cascadeOnDelete();
    });

    Schema::create('tour_categories', function (Blueprint $table) {
      $table->id();
      $table->string('name')->unique();
      $table->text('description')->nullable();
      $table->unsignedInteger('position_no')->default(0);
      $table->foreignId('company_id')
        ->constrained('companies')
        ->cascadeOnDelete();
      $table->timestamps();
      $table->unique(['company_id', 'name']);
    });

    Schema::create('tours', function (Blueprint $table) {
      $table->id();
      $table->string('code');
      $table->string('name');
      $table->text('description')->nullable();
      $table->unsignedInteger('duration_days');
      $table->string('status')->default('active');
      $table->string('destination');
      $table->string('continent_name')->nullable();
      $table->string('region_name')->nullable();
      $table->string('country_name')->nullable();
      $table->decimal('showprice', 15, 2)->default(0);
      $table->decimal('earlybird', 15, 2)->default(0);
      $table->string('earlybird_note')->default('');
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
      $table->foreignId('continent_id')
        ->nullable()
        ->constrained('continents')
        ->cascadeOnDelete();
      $table->foreignId('region_id')
        ->nullable()
        ->constrained('regions')
        ->cascadeOnDelete();
      $table->foreignId('country_id')
        ->nullable()
        ->constrained('countries')
        ->cascadeOnDelete();
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
    Schema::dropIfExists('tour_document_knowledge_bases');
    Schema::dropIfExists('tour_categories');
    Schema::dropIfExists('tours');
    Schema::dropIfExists('country');
    Schema::dropIfExists('region');
    Schema::dropIfExists('continent');
  }
};
