<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->default('');
            $table->string('provider');
            $table->string('method');
            $table->enum('category', ['banktransfer', 'creditcard', 'conveniencestore', 'qris']);
            $table->json('meta')->nullable();
            $table->enum('status', ['enabled', 'disabled', 'maintenance'])->default('enabled');
            $table->timestamps();

            $table->unique(['provider', 'method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
