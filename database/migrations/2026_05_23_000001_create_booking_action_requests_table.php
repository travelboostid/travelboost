<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_action_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requester_company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('requester_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('target_action');
            $table->string('status')->default('pending');
            $table->text('reason')->nullable();
            $table->foreignId('reviewer_company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->foreignId('reviewer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'target_action']);
            $table->index(['booking_id', 'target_action', 'status'], 'booking_action_requests_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_action_requests');
    }
};
