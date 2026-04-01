<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('name');
            $table->string('username');
            $table->string('email');
            $table->timestamp('email_verified_at')->nullable(); 
            $table->string('password');
            $table->string('phone')->nullable();
            $table->string('status')->default('active');
            $table->jsonb('meta')->nullable();
            $table->rememberToken(); 
            $table->timestamps();

            $table->unique(['company_id', 'email'], 'customers_company_email_unique');
            $table->unique(['company_id', 'username'], 'customers_company_username_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};