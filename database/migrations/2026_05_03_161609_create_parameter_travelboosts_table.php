<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('parameter_travelboosts', function (Blueprint $table) {
      $table->id();
      $table->string('category', 100);
      $table->string('param_key', 100);
      $table->string('param_label', 150)->nullable();
      $table->string('data_type', 20);
      $table->decimal('number_value', 18, 2)->nullable();
      $table->text('text_value')->nullable();
      $table->boolean('is_active')->default(true);
      $table->timestamps();

      $table->unique(['category', 'param_key']);
      $table->index('category');
      $table->index('data_type');
      $table->index('is_active');
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('parameter_travelboosts');
  }
};
