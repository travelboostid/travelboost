<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotion_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->unique()->constrained('companies')->cascadeOnDelete();
            $table->decimal('balance', 16, 8)->default(0);
            $table->timestamps();
        });

        Schema::create('promotion_budget_topup_payments', function (Blueprint $table) {
            $table->id();
            $table->decimal('amount', 14, 2);
            $table->timestamps();
        });

        Schema::create('promotion_budget_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('type');
            $table->decimal('amount', 16, 8);
            $table->nullableMorphs('reference');
            $table->string('description')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_budget_transactions');
        Schema::dropIfExists('promotion_budget_topup_payments');
        Schema::dropIfExists('promotion_budgets');
    }
};
