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
        Schema::create('parameter_vendors_values', function (Blueprint $table) {
            $table->id();

            $table->foreignId('parameter_id')
                ->constrained('parameter_vendors')
                ->cascadeOnDelete();

            // redundan company_id supaya query lebih cepat/filter mudah
            $table->foreignId('company_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->longText('value')->nullable();

            $table->timestamps();

            // satu parameter satu value per company
            $table->unique(['company_id', 'parameter_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parameter_vendors_values');
    }
};
