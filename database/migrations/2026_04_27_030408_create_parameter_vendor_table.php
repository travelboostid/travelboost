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
        Schema::create('parameter_vendors', function (Blueprint $table) {
            $table->id();

            // Relasi ke companies
            $table->foreignId('company_id')
                ->constrained()
                ->cascadeOnDelete();

            // Group kategori
            $table->string('category', 100); 
            // contoh: Payment Gateway, Bank Transfer, Fee, Company, API

            // Key unik per company
            $table->string('param_key', 100);
            // contoh: pg_username, pg_password, bank_bca

            $table->string('label', 150);
            // contoh: Username PG

            $table->enum('input_type', [
                'text',
                'password',
                'textarea',
                'number',
                'percent',
                'json'
            ])->default('text');

            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // key unik per company
            $table->unique(['company_id', 'param_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parameter_vendors');
    }
};
