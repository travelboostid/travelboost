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
        Schema::create('continent', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('continent');
            $table->foreignId('user_id')
              ->constrained('users')
              ->cascadeOnDelete();
        });

        Schema::create('region', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('region');
            $table->foreignId('continent_id')
              ->constrained('continent')
              ->cascadeOnDelete();
        });

        Schema::create('country', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('country');
            $table->foreignId('continent_id')
              ->constrained('continent')
              ->cascadeOnDelete();
            $table->foreignId('region_id')
              ->constrained('region')
              ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('continent');
        Schema::dropIfExists('region');
        Schema::dropIfExists('country');
    }
};
